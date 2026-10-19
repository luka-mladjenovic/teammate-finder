// Contact by UF email (D2). Emails show only after both sides agreed: you share a project (accepted members).
// The client mirrors the unlock rule (useAppData().canSeeEmail) and never asks for an email it can't have;
// the server enforces it (GET /api/students/:id/contact answers 403 otherwise).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { contactSubject, firstName, joinWords, mailtoHref, subjectProject } from '../lib/contact'
import { isFull } from '../lib/projects'
import { returnState } from '../lib/returnTo'
import { useAppData } from '../state/AppData'
import { useContacts } from '../state/useContacts'
import type { Student, Team } from '../types'
import { Avatar } from './Avatar'
import { CopyButton } from './CopyButton'
import { LockIcon } from './SignedOutPage'

/** Why the email is hidden (or not there yet), with an optional action under it. */
function Locked({ children, action, icon = true }: { children: ReactNode; action?: ReactNode; icon?: boolean }) {
  return (
    <div className="contact-locked">
      {icon && <LockIcon />}
      <div className="contact-locked-body">
        <p className="small">{children}</p>
        {action}
      </div>
    </div>
  )
}

function Loading({ label, rows = 2 }: { label: string; rows?: number }) {
  return (
    <div className="contact-loading" aria-busy="true">
      <span className="sr-only" role="status">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 16, width: i % 2 ? '45%' : '70%' }} />
      ))}
    </div>
  )
}

function LoadError({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="contact-error" role="alert">
      <p className="small">{text}</p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>
    </div>
  )
}

/** Signed out. Signing in comes back to this page. */
function SignedOut() {
  const location = useLocation()
  return (
    <Locked action={<Link to="/signin" state={returnState(location)} className="btn btn-secondary btn-sm">Sign in</Link>}>
      Sign in with your UF email to see contact details.
    </Locked>
  )
}

interface ContactCardProps {
  student: Student
  /** True when the email unlocked while this page was open: announce it and move focus to the heading. */
  justUnlocked?: boolean
}

/** Profile page card. Locked, it says exactly when the email unlocks; unlocked, it offers Copy and Email. */
export function ContactCard({ student, justUnlocked = false }: ContactCardProps) {
  const { viewer, session, team, sharedProjectsWith, pendingInvites, notify } = useAppData()
  const { status, contacts, retry } = useContacts([student.id])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const addrRef = useRef<HTMLSpanElement>(null)
  const shared = sharedProjectsWith(student.id)
  const project = subjectProject(shared, team?.id)
  const first = firstName(student.name)
  const announced = useRef(false)
  const headingId = `contact-${student.id}`

  useEffect(() => {
    if (!justUnlocked || announced.current || !project) return
    announced.current = true
    headingRef.current?.focus()
    // The prototype accepts invites at once; say so, so nobody wonders why there was no waiting.
    notify(`Invite accepted: ${first} joined ${project.project}. Their UF email is now shown.`)
  }, [justUnlocked, project, first, notify])

  let body: ReactNode
  if (viewer && student.id === viewer.id) {
    body = (
      <p className="small muted">
        Students see your UF email ({viewer.email ?? 'not set yet'}) once you're on the same team: after one of you accepts the
        other's invite or join request.
      </p>
    )
  } else if (session === 'signed_out') {
    body = <SignedOut />
  } else if (status === 'idle') {
    const invited = pendingInvites.some((i) => i.studentId === student.id)
    body = (
      <Locked>
        {invited
          ? 'Invite sent. Their UF email appears here once they accept.'
          : !team
            ? "Their UF email appears here once you're on the same team."
            : isFull(team)
              ? `${team.project} is full. Their UF email stays private unless you end up on the same team.`
              : `Their UF email appears here once they accept your invite to ${team.project}. Until then, neither of you can see the other's email.`}
      </Locked>
    )
  } else if (status === 'loading') {
    body = <Loading label="Loading email…" />
  } else if (status === 'error' || !contacts[student.id]) {
    body = <LoadError text="Couldn't load their email." onRetry={retry} />
  } else {
    const email = contacts[student.id].email
    body = (
      <>
        <p className="small">You're teammates in {joinWords(shared.map((p) => p.project))}.</p>
        <div className="contact-field">
          <span className="contact-field-label tiny muted">UF email</span>
          <span ref={addrRef} className="contact-addr">{email}</span>
        </div>
        <div className="contact-actions">
          <CopyButton text={email} selectTarget={() => addrRef.current} />
          {project && (
            <a className="btn btn-primary btn-sm" href={mailtoHref([email], contactSubject(project))}>Email {first}</a>
          )}
        </div>
        <p className="tiny muted">Opens your email app with the project in the subject. If nothing opens, copy the address instead.</p>
      </>
    )
  }

  return (
    <section className="card contact-card" aria-labelledby={headingId}>
      <h3 id={headingId} ref={headingRef} tabIndex={-1}>Contact</h3>
      {body}
    </section>
  )
}

interface TeamProps {
  team: Team
  /** Members other than the viewer. */
  others: Student[]
}

/** My team card: every other member's UF email with Copy and Email, plus "Copy all emails". */
export function TeamContactCard({ team, others }: TeamProps) {
  const { session } = useAppData()
  const { status, contacts, retry } = useContacts(others.map((m) => m.id))
  const addrRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const allRef = useRef<HTMLSpanElement>(null)
  // The joined list stays hidden until the clipboard is blocked; then it shows, selected, ready for Ctrl+C.
  const [showAll, setShowAll] = useState(false)
  const subject = contactSubject(team)

  let body: ReactNode
  if (session === 'signed_out') {
    body = <SignedOut />
  } else if (others.length === 0) {
    body = (
      <Locked icon={false} action={<Link to="/find" className="btn btn-secondary btn-sm">Find teammates</Link>}>
        No teammates yet. When someone accepts your invite, their UF email shows up here.
      </Locked>
    )
  } else if (status === 'loading' || status === 'idle') {
    body = <Loading label="Loading emails…" rows={others.length * 2} />
  } else if (status === 'error') {
    body = <LoadError text="Couldn't load your teammates' emails." onRetry={retry} />
  } else {
    const emails = others.map((m) => contacts[m.id]?.email).filter((e): e is string => Boolean(e))
    const all = emails.join(', ')
    body = (
      <>
        <ul className="contact-rows">
          {others.map((m) => {
            const email = contacts[m.id]?.email
            if (!email) return null
            return (
              <li key={m.id} className="contact-row">
                <Avatar student={m} size={32} />
                <div className="contact-who">
                  <Link to={`/people/${m.id}`} className="contact-name small">{m.name}</Link>
                  <span ref={(el) => { addrRefs.current[m.id] = el }} className="contact-addr small">{email}</span>
                </div>
                <div className="contact-actions">
                  <CopyButton text={email} srSuffix={` for ${m.name}`} selectTarget={() => addrRefs.current[m.id] ?? null} />
                  <a className="btn btn-secondary btn-sm" href={mailtoHref([email], subject)}>
                    Email<span className="sr-only"> {m.name}</span>
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
        {emails.length > 1 && (
          <div className="contact-foot">
            <CopyButton
              text={all}
              label="Copy all emails"
              copiedMessage="Email addresses copied."
              selectTarget={() => {
                setShowAll(true)
                return allRef.current
              }}
            />
            <span ref={allRef} className={`contact-addr contact-all small ${showAll ? '' : 'sr-only'}`} aria-hidden={showAll ? undefined : true}>
              {all}
            </span>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="card contact-card" aria-labelledby="team-contact-title">
      <h3 id="team-contact-title">Contact</h3>
      {others.length > 0 && session === 'signed_in' && (
        <p className="tiny muted">Everyone here agreed to team up, so the team can see these emails.</p>
      )}
      {body}
    </section>
  )
}

/** "Email the team" for the My team header. Hidden with no teammates or when signed out; disabled while emails load. */
export function EmailTeamLink({ team, others }: TeamProps) {
  const { status, contacts } = useContacts(others.map((m) => m.id))
  if (others.length === 0 || status === 'idle') return null
  const emails = others.map((m) => contacts[m.id]?.email).filter((e): e is string => Boolean(e))
  if (status !== 'done' || emails.length === 0) {
    return (
      <button type="button" className="btn btn-secondary" disabled>
        Email the team
      </button>
    )
  }
  return (
    <a className="btn btn-secondary" href={mailtoHref(emails, contactSubject(team))}>
      Email the team
    </a>
  )
}
