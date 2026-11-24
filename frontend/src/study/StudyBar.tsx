// The study harness inside the app (Shell renders <StudyChrome /> on every page):
// - on /study pages and during a StackUp task the look is locked to Classic, light, Electric, without saving it;
//   leaving the study puts the saved look back;
// - while a session is in progress and no StackUp task runs, any app page sends the participant back to the session's
//   steps, /study/run or (self-guided) /study/self/run (the browser's Back button after a StackUp task would otherwise
//   land in the normal demo);
// - during a StackUp task a slim fixed bar sits above the app ("Task 1 of 2", Skip) with the task card open, like
//   the board's: docked on the right at 1000 px and wider, in the bar (Hide task / Show task) on narrower screens.
//   A self-guided session has no Skip: no facilitator is there to use it.
//   The Style button is hidden, and every Invite records the participant's choice (after a one-step confirm)
//   instead of inviting. When the 7-minute limit ends the task (store.ts) the bar goes and, as above, the page
//   returns to the session's steps.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { applyAccent, applyMode, applyTheme, initialAccent, initialMode, initialTheme } from '../fun/theme'
import { interceptInvites } from '../state/AppData'
import { NUDGE_TEXT, useNudge } from './hooks'
import { StudyConfirm, TaskCardBody } from './parts'
import { CHOOSE_TEXT, SKIP_TEXT } from './questions'
import { SCENARIOS } from './scenarios'
import { appTaskIndex, endTask, isStudyPath, runPath, useStudy, type Session } from './store'

/** True while this module has the Classic look on. */
let locked = false

/** Classic look for the study, or the saved look back. Never written to storage, so your own choice survives. */
function lockLook(on: boolean) {
  if (on === locked) return
  locked = on
  if (on) {
    applyAccent('electric', false)
    applyMode('light', false)
    applyTheme('default', false)
  } else {
    applyAccent(initialAccent(), false)
    applyMode(initialMode(), false)
    applyTheme(initialTheme(), false)
  }
}

export function StudyChrome() {
  const { current } = useStudy()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onStudyPage = isStudyPath(pathname)
  const task = USING_MOCK ? appTaskIndex(current) : undefined
  const inApp = task !== undefined && !onStudyPage
  // In a session but outside the study, with no StackUp task running: e.g. Back from the questions after one.
  const strayed = USING_MOCK && current !== null && task === undefined && !onStudyPage
  const steps = runPath(current)

  useLayoutEffect(() => lockLook(onStudyPage || task !== undefined), [onStudyPage, task])

  useEffect(() => {
    if (strayed) navigate(steps, { replace: true })
  }, [strayed, steps, navigate])

  // Marks <html> so study.css hides the Style button and makes room for the bar and the task card.
  useLayoutEffect(() => {
    if (!inApp) return
    document.documentElement.dataset.study = 'task'
    return () => {
      delete document.documentElement.dataset.study
      document.documentElement.style.removeProperty('--study-bar-h')
    }
  }, [inApp])

  return inApp && current && task !== undefined ? <StudyBar session={current} i={task} /> : null
}

function StudyBar({ session, i }: { session: Session; i: 0 | 1 }) {
  const task = session.tasks[i]
  const scenario = SCENARIOS[task.scenario]
  const navigate = useNavigate()
  const nudged = useNudge(i, task)
  const panelId = useId()
  const barRef = useRef<HTMLDivElement>(null)
  // Open from the start, like the board's card. Only narrow screens can fold it away (study.css).
  const [showTask, setShowTask] = useState(true)
  const [skipping, setSkipping] = useState(false)
  // The Invite waiting for "Choose {name}?": who, and how to settle AppData's invite() call.
  const [asking, setAsking] = useState<{ id: string; settle: (v: boolean) => void } | null>(null)

  // Every Invite comes here while the bar is up (AppData.invite). It always resolves false: nothing is invited.
  useEffect(() => {
    interceptInvites((id) => new Promise<boolean>((settle) => setAsking({ id, settle })))
    return () => interceptInvites(null)
  }, [])
  // The time limit can end the task while "Choose {name}?" is open: the waiting invite() call still gets its answer.
  useEffect(() => () => asking?.settle(false), [asking])

  // The bar's height (it grows with the nudge, and on a narrow screen with the open task card) is the room the app
  // leaves at the top.
  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--study-bar-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const finish = (choiceId: string | null) => {
    endTask(i, choiceId)
    // Replace, so Back from the questions doesn't return to the task's last app page.
    navigate(runPath(session), { replace: true })
  }

  const chosen = asking ? scenario.candidates.find((c) => c.id === asking.id) : undefined

  return (
    <div ref={barRef} className="study-bar" role="region" aria-label="Study task">
      <div className="study-bar-inner">
        <strong className="study-bar-step">Task {i + 1} of 2</strong>
        <button
          type="button"
          className="btn btn-secondary btn-sm study-bar-toggle"
          aria-expanded={showTask}
          aria-controls={panelId}
          onClick={() => setShowTask((v) => !v)}
        >
          {showTask ? 'Hide task' : 'Show task'}
        </button>
        <span className="spacer" />
        {session.mode !== 'self' && (
          <button type="button" className="study-skip" onClick={() => setSkipping(true)}>
            Skip (facilitator)
          </button>
        )}
      </div>
      <div className="study-bar-nudge" role="status" aria-live="polite">
        {nudged ? NUDGE_TEXT : ''}
      </div>
      <section id={panelId} className="study-bar-panel" hidden={!showTask} aria-labelledby={`${panelId}-title`}>
        <h2 id={`${panelId}-title`} className="study-card-title">{scenario.taskCard.title}</h2>
        <TaskCardBody scenario={scenario} ui="stackup" />
      </section>

      <StudyConfirm
        open={asking !== null}
        title={chosen ? `Choose ${chosen.name}?` : 'Choose this student?'}
        confirmLabel="Choose"
        onCancel={() => {
          asking?.settle(false)
          setAsking(null)
        }}
        onConfirm={() => {
          if (!asking) return
          asking.settle(false)
          setAsking(null)
          finish(asking.id)
        }}
      >
        <p>{CHOOSE_TEXT}</p>
      </StudyConfirm>

      <StudyConfirm
        open={skipping}
        title="Skip this task?"
        confirmLabel="Skip task"
        onCancel={() => setSkipping(false)}
        onConfirm={() => {
          setSkipping(false)
          finish(null)
        }}
      >
        <p>{SKIP_TEXT}</p>
      </StudyConfirm>
    </div>
  )
}
