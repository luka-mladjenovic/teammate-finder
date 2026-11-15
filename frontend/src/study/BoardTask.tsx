// The baseline condition (plan section 3): a course discussion thread where each student introduces themselves in
// free text, the way students look for teammates today. Plain and realistic, in the style of an LMS discussion page,
// with nothing from StackUp: no match checks, filters or profiles. Posts keep the scenario's fixed order. The task
// card stays in view (a sticky side panel on wide screens, a collapsible panel on top on narrow ones).
import { useId, useState } from 'react'
import { initials } from '../components/Avatar'
import { NUDGE_TEXT, useNudge, useStepFocus, useTitle } from './hooks'
import { StudyConfirm, TaskCardBody } from './parts'
import { SKIP_TEXT } from './questions'
import { SCENARIOS } from './scenarios'
import { endTask, type Session } from './store'

/** "Oct 22, 2026, 1:45 PM" in Eastern Time (posts are stored in UTC; UF is in Florida). */
const POSTED = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' })

export function BoardTask({ session, i }: { session: Session; i: 0 | 1 }) {
  const task = session.tasks[i]
  const scenario = SCENARIOS[task.scenario]
  const { board } = scenario
  const nudged = useNudge(i, task)
  const headingRef = useStepFocus()
  const panelId = useId()
  const [taskOpen, setTaskOpen] = useState(true)
  const [asking, setAsking] = useState<string | null>(null)
  const [skipping, setSkipping] = useState(false)
  useTitle(`${board.threadTitle} - Discussions`)

  const byId = new Map(scenario.candidates.map((c) => [c.id, c]))
  const chosen = asking ? byId.get(asking) : undefined
  // The thread was opened the day before the first reply.
  const opened = new Date(Date.parse(board.posts[0]?.postedAt ?? '') - 24 * 60 * 60 * 1000)

  return (
    <div className="board-page">
      <div className="board-nudge" role="status" aria-live="polite">
        {nudged ? NUDGE_TEXT : ''}
      </div>
      <header className="board-crumbs">
        <span>{scenario.team.course}</span>
        <span aria-hidden="true">›</span>
        <span>Discussions</span>
      </header>

      <div className="board-layout">
        <aside className={`board-side${taskOpen ? '' : ' is-collapsed'}`} aria-labelledby={`${panelId}-title`}>
          <div className="board-side-head">
            <h2 id={`${panelId}-title`} className="study-card-title">{scenario.taskCard.title}</h2>
            <button
              type="button"
              className="board-btn board-side-toggle"
              aria-expanded={taskOpen}
              aria-controls={panelId}
              onClick={() => setTaskOpen((v) => !v)}
            >
              {taskOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          <div id={panelId} className="board-side-body">
            <TaskCardBody scenario={scenario} ui="board" />
            <button type="button" className="study-skip" onClick={() => setSkipping(true)}>
              Skip (facilitator)
            </button>
          </div>
        </aside>

        <article className="board-thread" aria-labelledby={`${panelId}-thread`}>
          <h1 id={`${panelId}-thread`} ref={headingRef} tabIndex={-1} className="board-title">
            {board.threadTitle}
          </h1>
          <div className="board-op">
            <span className="board-avatar" aria-hidden="true">IN</span>
            <div className="board-who">
              <strong>Instructor</strong>
              <span className="board-date">{Number.isNaN(opened.getTime()) ? '' : DAY.format(opened)}</span>
            </div>
          </div>
          <p className="board-intro">{board.intro}</p>

          <h2 className="board-count">{board.posts.length} Replies</h2>
          <ol className="board-replies">
            {board.posts.map((p) => {
              const s = byId.get(p.studentId)
              if (!s) return null
              return (
                <li key={p.studentId}>
                  <article className="board-post" aria-labelledby={`${panelId}-${s.id}`}>
                    <div className="board-post-head">
                      <span className="board-avatar" aria-hidden="true">{initials(s.name)}</span>
                      <div className="board-who">
                        <strong id={`${panelId}-${s.id}`}>{s.name}</strong>
                        <time className="board-date" dateTime={p.postedAt}>{POSTED.format(new Date(p.postedAt))}</time>
                      </div>
                    </div>
                    <p className="board-body">{p.body}</p>
                    <div className="board-post-foot">
                      <button type="button" className="board-btn" onClick={() => setAsking(s.id)}>
                        Choose<span className="sr-only"> {s.name}</span>
                      </button>
                    </div>
                  </article>
                </li>
              )
            })}
          </ol>
        </article>
      </div>

      <StudyConfirm
        open={asking !== null}
        className="board-dialog"
        title={chosen ? `Choose ${chosen.name}?` : 'Choose this student?'}
        confirmLabel="Choose"
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          const id = asking
          setAsking(null)
          if (id) endTask(i, id)
        }}
      >
        <p>This is your choice for this task.</p>
      </StudyConfirm>

      <StudyConfirm
        open={skipping}
        className="board-dialog"
        title="Skip this task?"
        confirmLabel="Skip task"
        onCancel={() => setSkipping(false)}
        onConfirm={() => {
          setSkipping(false)
          endTask(i, null)
        }}
      >
        <p>{SKIP_TEXT}</p>
      </StudyConfirm>
    </div>
  )
}
