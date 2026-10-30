// UF-only sign-up and sign-in (D3): /signup and /signin. Step 1 takes a UF email (plus a name when signing up),
// step 2 a 6-digit one-time code. The prototype sends no email and shows the code on the page; a server in demo
// mode sends the email and also returns the code, which the page shows the same way.
// Our own design from the app's tokens: no UF logos and nothing that imitates UF's official login.
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, isApiError, USING_MOCK } from '../api'
import { focusField, TextField } from '../components/Field'
import { firstName } from '../lib/contact'
import { returnPath } from '../lib/returnTo'
import { checkUfEmail } from '../lib/ufEmail'
import { useAppData } from '../state/AppData'
import type { EmailChallenge } from '../types'

type Mode = 'signup' | 'signin'
type Step = 1 | 2

const CODE_LEN = 6
const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again."

/** "0:24". */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
/** "1 second", "12 seconds". */
const seconds = (s: number) => `${s} second${s === 1 ? '' : 's'}`
/** "482913" → "482 913", easier to read and copy. */
const spaced = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`

export function SignUp({ mode }: { mode: Mode }) {
  // Switching between /signup and /signin starts the flow over.
  return <AuthFlow key={mode} mode={mode} />
}

function StepBar({ step }: { step: Step }) {
  return (
    <ol className="auth-steps" aria-hidden="true">
      <li className="is-reached" />
      <li className={step === 2 ? 'is-reached' : ''} />
    </ol>
  )
}

function AuthFlow({ mode }: { mode: Mode }) {
  const { session, viewer, applySignIn, notify } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const signup = mode === 'signup'
  // The page that asked them to sign in (a sign-in prompt passes it), to return to afterwards. The switch
  // between Sign up and Sign in passes it on.
  const back = returnPath(location.state)
  const backState = back ? { from: back } : undefined

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState('')
  /** The server's answer when it rejects the address (422), shown on the field like our own checks. */
  const [serverEmailError, setServerEmailError] = useState('')

  const [challenge, setChallenge] = useState<EmailChallenge | null>(null)
  /** The name the current code was requested with (sign-up), so going back with the same details reuses it. */
  const [sentName, setSentName] = useState('')
  /** Step 2 was reopened from "Change email" without sending a new code. */
  const [reused, setReused] = useState(false)
  const [code, setCode] = useState('')
  const [codeTried, setCodeTried] = useState(false)
  const [codeError, setCodeError] = useState('')
  /** Too many wrong codes: Verify is off until a new code. */
  const [locked, setLocked] = useState(false)
  /** The code expired or was replaced, so it can't be reused. */
  const [spent, setSpent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  /** The server's short wait between codes for one address (429 with retryAfter under a minute). */
  const [wait, setWait] = useState<{ email: string; until: number } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [live, setLive] = useState({ text: '', n: 0 })
  const say = (text: string) => setLive((l) => ({ text, n: l.n + 1 }))

  /**
   * Moves focus to the field with the problem. When it already has focus (Enter pressed in it), nothing
   * would be re-read, so the message is announced instead.
   */
  const flagField = (id: string, message: string) => {
    if (document.activeElement?.id === id) say(message)
    else focusField(id)
  }

  // After a step change, start keyboard and screen-reader users at the new heading. The new step mounts only
  // after the old one fades out, so the heading focuses itself when it appears.
  const focusStep = useRef<Step | null>(null)
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el && focusStep.current !== null && el.dataset.step === String(focusStep.current)) {
      focusStep.current = null
      el.focus()
    }
  }, [])
  const goTo = (s: Step) => {
    focusStep.current = s
    setStep(s)
  }

  // Countdowns for "Send a new code in 0:24" and "Wait 12 seconds" (not announced).
  const tickUntil = Math.max(challenge ? Date.parse(challenge.resendAfter) : 0, wait?.until ?? 0)
  useEffect(() => {
    if (!tickUntil) return
    const t = window.setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= tickUntil) window.clearInterval(t)
    }, 1000)
    return () => window.clearInterval(t)
  }, [tickUntil])

  const validate = () => {
    const e: Record<string, string> = {}
    if (signup && !name.trim()) e['auth-name'] = 'Add your name so teammates know who you are.'
    const c = checkUfEmail(email)
    if (!c.ok) e['auth-email'] = c.message
    else if (serverEmailError) e['auth-email'] = serverEmailError
    return e
  }
  const errors = tried ? validate() : {}

  const sendCode = async (resend: boolean) => {
    const c = checkUfEmail(email)
    if (!c.ok) return
    setSending(true)
    setBanner('')
    setWait(null)
    try {
      const ch = await api.startEmailCode(signup ? { email: c.email, name: name.trim() } : { email: c.email })
      setChallenge(ch)
      setSentName(name.trim())
      setReused(false)
      setNow(Date.now())
      setCode('')
      setCodeTried(false)
      setCodeError('')
      setLocked(false)
      setSpent(false)
      if (resend) {
        say('New code sent. The old one no longer works.')
        focusField('auth-code')
      } else {
        goTo(2)
      }
    } catch (e) {
      if (isApiError(e) && e.code === 'rate_limited') {
        const s = Math.max(1, Math.ceil(e.body.retryAfter ?? 60))
        if (s < 60) {
          // One code per address every 30 s: count the wait down on the page and announce it once.
          setWait({ email: c.email, until: Date.now() + s * 1000 })
          setNow(Date.now())
          say(`You just asked for a code. Wait ${seconds(s)}, then try again.`)
        } else {
          const min = Math.ceil(s / 60)
          setBanner(`Too many codes requested. Try again in ${min} minute${min === 1 ? '' : 's'}.`)
        }
      } else if (isApiError(e) && (e.code === 'not_ufl_email' || e.code === 'invalid_email')) {
        // The server re-checks every address; show its reason on the field.
        setServerEmailError(e.message)
        if (step === 2) goTo(1)
        else focusField('auth-email')
      } else {
        setBanner(NETWORK_ERROR)
      }
    } finally {
      setSending(false)
    }
  }

  const submitEmail = (ev: FormEvent) => {
    ev.preventDefault()
    if (sending) return
    setTried(true)
    const errs = validate()
    const first = Object.keys(errs)[0]
    if (first) {
      flagField(first, errs[first])
      return
    }
    // Back from "Change email" with the same details while the code still works: return to it instead of
    // asking for another (the server allows one every 30 s, and a new code would void the one they have).
    const c = checkUfEmail(email)
    const usable = challenge && !locked && !spent && Date.now() < Date.parse(challenge.expiresAt)
    if (usable && c.ok && c.email === challenge.email && (!signup || name.trim() === sentName)) {
      setReused(true)
      say(`Your code for ${challenge.email} still works.`)
      goTo(2)
      return
    }
    void sendCode(false)
  }

  const submitCode = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!challenge || locked || verifying) return
    setCodeTried(true)
    if (code.length < CODE_LEN) {
      setCodeError('')
      flagField('auth-code', 'Enter all 6 digits.')
      return
    }
    setVerifying(true)
    setCodeError('')
    try {
      const result = await api.verifyEmailCode({ challengeId: challenge.challengeId, code })
      applySignIn(result)
      if (result.isNewAccount) {
        // Profile setup first; its Finish then goes on to `back`.
        navigate('/profile/setup', { state: { welcome: firstName(result.me.name), ...backState } })
      } else {
        navigate(back ?? '/find')
        notify(signup ? "Welcome back. You already had an account, so you're signed in." : `Signed in as ${result.me.email}.`)
      }
    } catch (e) {
      const c = isApiError(e) ? e.code : ''
      let message = ''
      if (c === 'invalid_code') {
        const n = isApiError(e) ? (e.body.attemptsLeft ?? 0) : 0
        message = `That code doesn't match. ${n} ${n === 1 ? 'try' : 'tries'} left.`
      } else if (c === 'too_many_attempts') {
        setLocked(true)
        message = 'Too many wrong codes. Send a new code to try again.'
      } else if (c === 'code_expired') {
        setSpent(true)
        message = 'This code expired. Send a new code.'
      } else if (c === 'challenge_not_found') {
        setSpent(true)
        message = 'That code was replaced by a newer one. Use the latest code.'
      } else {
        // The banner is an alert, so it announces itself.
        setBanner(NETWORK_ERROR)
      }
      setCodeError(message)
      if (message) flagField('auth-code', message)
      else focusField('auth-code')
      setVerifying(false)
    }
  }

  const waitS = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.resendAfter) - now) / 1000)) : 0
  const typed = checkUfEmail(email)
  // The short wait only applies to the address it was for.
  const waitLeft = wait && typed.ok && typed.email === wait.email ? Math.max(0, Math.ceil((wait.until - now) / 1000)) : 0
  const demo = challenge?.demoCode
  const codeMessage = codeTried && code.length < CODE_LEN && !codeError ? 'Enter all 6 digits.' : codeError
  const verb = signup ? 'Sign up' : 'Sign in'
  const signedInAs = session === 'signed_in' ? viewer?.email : undefined
  const notices = (
    <>
      {banner && <p className="setup-banner is-warn auth-banner" role="alert">{banner}</p>}
      {waitLeft > 0 && (
        <p className="setup-banner is-warn auth-banner">
          You just asked for a code. Wait {seconds(waitLeft)}, then try again.
        </p>
      )}
    </>
  )

  return (
    <div className="page auth-page">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          // Cross-fade with a small slide; under reduced motion only the fade remains.
          initial={{ opacity: 0, x: step === 2 ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 2 ? -16 : 16 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {step === 1 ? (
            <form className="card auth-card" noValidate onSubmit={submitEmail} aria-labelledby="auth-title">
              <div className="auth-top">
                <span className="auth-eyebrow">{verb} · Step 1 of 2</span>
                <StepBar step={1} />
              </div>
              <div className="auth-intro">
                <h1 id="auth-title" ref={headingRef} tabIndex={-1} data-step="1">
                  {signup ? 'Join with your UF email' : 'Sign in with your UF email'}
                </h1>
                <p className="muted">
                  {signup
                    ? "StackUp is for UF students. Your @ufl.edu address shows classmates you're real."
                    : "We'll check it's you with a one-time code."}
                </p>
              </div>
              {notices}
              {signedInAs && (
                <p className="setup-note auth-note">
                  You're signed in as {signedInAs}.{' '}
                  {signup
                    ? `Signing up again switches ${USING_MOCK ? 'this demo' : 'you'} to the new account.`
                    : `Signing in again switches ${USING_MOCK ? 'this demo' : 'you'} to that account.`}
                </p>
              )}
              {signup && (
                <TextField
                  id="auth-name"
                  label="Name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={setName}
                  error={errors['auth-name']}
                />
              )}
              <TextField
                id="auth-email"
                label="UF email"
                required
                type="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="yourname@ufl.edu"
                maxLength={120}
                value={email}
                onChange={(v) => {
                  setEmail(v)
                  setServerEmailError('')
                }}
                help={signup ? 'Must end in @ufl.edu. Only students on a team with you can see it.' : 'Must end in @ufl.edu.'}
                error={errors['auth-email']}
              />
              <button type="submit" className="btn btn-primary auth-submit" disabled={sending} aria-busy={sending || undefined}>
                {sending ? 'Sending code…' : 'Send code'}
              </button>
              <p className="small auth-switch">
                {signup ? (
                  <>Already have an account? <Link to="/signin" state={backState}>Sign in</Link></>
                ) : (
                  <>New here? <Link to="/signup" state={backState}>Sign up</Link></>
                )}
              </p>
              {USING_MOCK && <p className="tiny muted auth-proto">Prototype: no email is sent and nothing is stored on a server.</p>}
            </form>
          ) : (
            <form className="card auth-card" noValidate onSubmit={submitCode} aria-labelledby="auth-title">
              <div className="auth-top">
                <span className="auth-eyebrow">{verb} · Step 2 of 2</span>
                <StepBar step={2} />
              </div>
              <div className="auth-intro">
                <h1 id="auth-title" ref={headingRef} tabIndex={-1} data-step="2">Enter your 6-digit code</h1>
                <p className="muted">
                  {/* "Still works" stops being true once the code is locked, expired or replaced. */}
                  {reused && !locked && !spent ? (
                    <>Your code for <strong className="auth-address">{challenge?.email}</strong> still works.</>
                  ) : demo && USING_MOCK ? (
                    // The prototype sends no email.
                    <>We'd email a code to <strong className="auth-address">{challenge?.email}</strong>.</>
                  ) : (
                    <>
                      We sent a 6-digit code to <strong className="auth-address">{challenge?.email}</strong>. It can take a
                      minute to arrive; check your junk folder.
                    </>
                  )}{' '}
                  <button type="button" className="auth-link" onClick={() => goTo(1)}>Change email</button>
                </p>
              </div>
              {notices}
              {demo && (
                <div className="auth-demo">
                  <p className="auth-demo-text">
                    {USING_MOCK ? 'Prototype: no email is sent. Your demo code is' : 'Demo mode: no need to wait for the email. Your code is'}{' '}
                    <strong className="auth-demo-code">{spaced(demo)}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setCode(demo)
                      if (!locked) setCodeError('')
                      focusField('auth-code')
                    }}
                  >
                    Use demo code
                  </button>
                </div>
              )}
              <TextField
                id="auth-code"
                label="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={false}
                inputClassName="auth-code"
                value={code}
                onChange={(v) => {
                  setCode(v.replace(/\D/g, '').slice(0, CODE_LEN))
                  if (!locked) setCodeError('')
                }}
                help="The code expires in 10 minutes."
                error={codeMessage || undefined}
              />
              <button type="submit" className="btn btn-primary auth-submit" disabled={verifying || locked} aria-busy={verifying || undefined}>
                {verifying ? 'Verifying…' : 'Verify and continue'}
              </button>
              <p className="small auth-switch">
                Didn't get it?{' '}
                <button type="button" className="auth-link" disabled={waitS > 0 || sending} onClick={() => void sendCode(true)}>
                  {sending ? 'Sending…' : waitS > 0 ? `Send a new code in ${clock(waitS)}` : 'Send a new code'}
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {live.text}
        {live.n % 2 ? ' ' : ''}
      </p>
    </div>
  )
}
