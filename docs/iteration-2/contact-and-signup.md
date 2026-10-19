# Iteration 2: Contact by UF email (D2) and UF-only sign-up (D3)

Owner: PM-B · 2026-10-19 · Status: ready to build. Availability is PM-A's area, projects/teams are PM-C's; see section 9.

> API details: [`../data-model.md`](../data-model.md) is the source of truth. Where this spec's endpoint tables or error codes disagree with it, follow `data-model.md`.

## 1. Problem and evidence

- **No way to reach a match (F3 → U3).** A classmate asked for a messenger. Today the only contact path is a team Discord link (`Team.channelLink`: "Team Discord ↗" on My team, "Open team Discord" on a profile) and a "Discord handle" field in profile setup (default channel `discord`). Luka: some students in past projects had no Discord or Slack; everyone has a UF email.
- **Discord assumption leaks into matching.** `matchReasons` warns "Prefers Slack/Text/Email" when a candidate's channel differs from yours. That punishes people for not using Discord.
- **Emails are not actually private.** `docs/data-model.md` says email is "never shown to other users", but `GET /api/students` returns `email` for everyone. Only one mock student has a `contactHandle`.
- **Anyone could pose as a student (F5 → U5).** There is no sign-up; the viewer is hard-wired. Dimitri and Dale: build it for UF and require a valid @ufl.edu email.

## 2. Goals and non-goals

Goals: (1) after both sides agree, contacting a teammate takes one click (copy or open email); (2) before that, nobody sees anyone's email, and the UI says exactly when it unlocks; (3) only @ufl.edu addresses can sign up, proven with a one-time code; (4) a backend developer can build auth and contact from section 5 alone.

Non-goals: in-app chat, notifications, sending real email from the prototype, other universities, password accounts, blocking pages behind sign-in (the prototype stays demo-able), editing your email after sign-up.

## 3. User stories

1. As a team lead whose invite was just accepted, I want my new teammate's UF email with a copy button, so I can set up our first meeting right away.
2. As a student browsing candidates, I want to know why I can't see someone's email and when I will, so I'm not confused.
3. As a student without Discord, I want teams to reach me by UF email, so I'm not left out or marked as a worse fit.
4. As a team member, I want to email the whole team at once, so planning doesn't depend on a chat app.
5. As a new user, I want to sign up with my @ufl.edu email and a code, so classmates can trust I'm a real UF student.
6. As a student who typed the wrong address, I want an error that says what is wrong and how to fix it.

## 4. Screens

Shared building blocks (new): `src/lib/ufEmail.ts` (`checkUfEmail`), `src/lib/contact.ts` (`sharedProjects`, `contactSubject`, `mailtoHref`), `src/components/ContactCard.tsx`, `src/components/CopyButton.tsx`, `src/components/AccountMenu.tsx`, `src/pages/SignUp.tsx`, `src/styles/auth.css`. Move `TextField`, `FieldError` and `describedBy` out of ProfileSetup into `src/components/Field.tsx` and import `styles/setup.css` field styles from there. All colors from tokens; dark-theme tweaks go in the new CSS files under `html.theme-aurora` etc.

**Unlock rule (client mirror of the server rule).** The viewer may see student S's email when both are in `memberIds` of at least one of the viewer's projects. Accepted invites and accepted join requests both create membership; pending ones do not. Never render a cached email when the rule is false.

**Mail link.** `mailto:<addresses joined by ",">?subject=<encodeURIComponent(subject)>`, subject = `<project> (<course>) - Teammate Finder`, e.g. `Database Project (Database Systems) - Teammate Finder`. Project = the current project if S is in it, else the first shared project.

**Copy.** In the click handler: `navigator.clipboard.writeText(text)`. Success: visible label becomes "Copied ✓" for 2 s; polite live region says "Email address copied." Failure or no clipboard API: select the address text with a Range and say "Selected. Press Ctrl+C or ⌘C to copy." Address text uses `user-select: all` and `overflow-wrap: anywhere`.

### 4.1 Profile detail (`/people/:id`), Contact card

Locked: the card stays last in the grid. Unlocked: it moves to the first card, because contacting is now the main task. Heading "Contact" (`tabIndex={-1}`). Card has a polite live region. States and exact copy (`{First}` = first name, `{Project}` = current project name):

| State | Copy and controls |
|---|---|
| Locked, project has space | "Their UF email appears here once they accept your invite to {Project}. Until then, neither of you can see the other's email." |
| Locked, project full | "{Project} is full. Their UF email stays private unless you end up on the same team." |
| Locked, invite pending (real API) | "Invite sent. Their UF email appears here once they accept." The Invite button reads "Invite sent ✓" (aria-disabled) |
| Signed out | "Sign in with your UF email to see contact details." + link "Sign in" (`/signin`) |
| Your own profile | "Students see your UF email ({email}) once you're on the same team: after one of you accepts the other's invite or join request." |
| Loading | two `.skeleton` lines + sr-only "Loading email…" |
| Error | "Couldn't load their email." + button "Try again" |
| Unlocked | sub "You're teammates in {Project}." (several: "{A} and {B}"); label "UF email" over the address; buttons "Copy email" (secondary) and "Email {First}" (primary, mailto link); tiny muted "Opens your email app with the project in the subject. If nothing opens, copy the address instead." |

Unlock while open (prototype invites are accepted at once): the card flips to Loading then Unlocked without reload, focus moves to the Contact heading, the live region says "{First} joined {Project}. Their UF email is now shown." The "✓ UF email verified" note under the name stays. The Working style row "Channel" becomes "Team chat". Phone (390 px): the grid is one column; buttons wrap below the address.

### 4.2 My team (`/team`, current project)

- Hero: "Team Discord ↗" is replaced by link "Email the team" (secondary): mailto to all other members, subject as above. Hidden when nobody else is on the team; a disabled button with the same text while emails load.
- New card **Contact**, second in the grid after Members. Sub: "Everyone here agreed to team up, so the team can see these emails." One row per other member: avatar 32, name (links to profile), address, "Copy email" (sr-only suffix " for {Name}") and "Email" (sr-only " {Name}"). Footer button "Copy all emails" copies `a, b, c`.
- Empty: "No teammates yet. When someone accepts your invite, their UF email shows up here." + link "Find teammates". Loading: skeleton rows + sr-only "Loading emails…". Error: "Couldn't load your teammates' emails." + "Try again".
- Removing a member removes their row at once; their profile shows Locked again unless another project is shared.
- Phone: name and address stack; buttons wrap to a second line; no horizontal scroll.

### 4.3 Profile setup (`/profile/setup`)

- Communication card: "Preferred channel" becomes **"Preferred team chat"**, help "First contact is always by UF email. This is what you'd like the team to use once it forms." Options in this order: UF email, Discord, Slack, Group text. New-profile default: UF email.
- The basics card: the "Discord handle" field is removed. In its place a read-only block: label "UF email", value `you@ufl.edu` with a good-colored "✓ Verified" chip, help "Only students on a team with you see it, after an invite or join request is accepted." With no email: "Not signed in." + link "Sign up with your UF email".
- Arriving from sign-up (`location.state.welcome`): banner (`.setup-banner`, `role="status"`) "Email verified. Welcome, {First}! Next, tell teammates how you work." Shown above the draft banner if both apply.
- Old drafts that contain `contactHandle` load fine (the key is ignored).

### 4.4 Find teammates, compare tray, Open teams

- Profile card facts, Profile detail and the compare tray relabel "Channel" to "Team chat". The compare tray shows no emails.
- `matchReasons` drops the "Prefers {channel}" warning: everyone can be reached by UF email, so a different chat preference no longer signals a contact problem.
- Open teams, after "Requested": tiny muted line "They'll see your profile. If they accept, the team is added to your projects. Switch to it to see their UF emails on My team."

### 4.5 Sign up (`/signup`) and sign in (`/signin`)

One component, two modes. Centered column, `max-width: 440px`, one `.card` holding a real `<form>` (Enter submits). Eyebrow "Sign up · Step 1 of 2" (or "Sign in · …"), then `h1` (`tabIndex={-1}`, focused after each step change), then sub text. Step changes cross-fade (fade only under reduced motion). No UF logos or official-login imitation; our own tokens only.

**Step 1, sign up.** h1 "Join with your UF email". Sub "Teammate Finder is for UF students. Your @ufl.edu address shows classmates you're real." Fields: Name * (`autocomplete="name"`); UF email * (`type="email"`, `inputMode="email"`, `autocomplete="email"`, `autoCapitalize="off"`, `spellCheck={false}`, placeholder `yourname@ufl.edu`, help "Must end in @ufl.edu. Only students on a team with you can see it."). Button "Send code" (full width, "Sending code…" + disabled + `aria-busy` while waiting). Below: "Already have an account? Sign in". Tiny muted, mock only: "Prototype: no email is sent and nothing is stored on a server." If already signed in: "You're signed in as {email}. Signing up again switches this demo to the new account." ("switches you" with a real API).

**Step 1, sign in.** h1 "Sign in with your UF email", sub "We'll check it's you with a one-time code.", email field only (help "Must end in @ufl.edu."), below "New here? Sign up".

**Validation** runs on submit, then live while fixing (as in ProfileSetup). Email is trimmed and lowercased first. Each error sets `aria-invalid`, is linked by `aria-describedby`, and focus moves to the first invalid field. If that field already has focus (Enter pressed in it), the message is announced through the live region instead, so a failed submit is never silent. The same applies to every code error in step 2.

| Input | Message |
|---|---|
| empty name (sign up) | "Add your name so teammates know who you are." |
| empty email | "Enter your UF email." |
| not an address (`alex`, `a@b`) | "That doesn't look like an email address. Check for a missing @ or a typo." |
| near miss: domain contains `ufl` or is `uf.edu` (`alex@cise.ufl.edu`, `alex@ufl.edu.com`) | "Only addresses that end in exactly @ufl.edu work. Did you mean alex@ufl.edu?" |
| other domain (`alex@gmail.com`) | "Use your @ufl.edu address. Teammate Finder is only for UF students for now, and teammates contact you by UF email." |
| server 429 `rate_limited`, `retryAfter` under 60 s | "You just asked for a code. Wait {n} seconds, then try again." The number counts down on the page and is announced once, not every second; it shows only for that address |
| server 429 `rate_limited`, hourly cap | banner (`role="alert"`): "Too many codes requested. Try again in {n} minutes." |
| network failure | banner: "Couldn't reach the server. Check your connection and try again." |

**Step 2, code.** h1 "Enter your 6-digit code". Sub, demo mode (a `demoCode` came back): "We'd email a code to {email}."; real mode: "We sent a 6-digit code to {email}. It can take a minute to arrive; check your junk folder." Then link-style button "Change email" (back to step 1, values kept). Sending the same name and address again while that code still works returns to step 2 without a new request, says "Your code for {email} still works." and keeps the resend countdown. Demo box (primary-soft): "Prototype: no email is sent. Your demo code is **482 913**." + button "Use demo code" (fills the field). Field: label "6-digit code", `inputMode="numeric"`, `autocomplete="one-time-code"`, no `maxLength` (it would cut pasted "482 913"); on change keep digits only, first 6. Large tabular digits, font-size ≥ 16 px. Help "The code expires in 10 minutes." Button "Verify and continue" ("Verifying…"). No auto-submit. Below: "Didn't get it?" + "Send a new code", disabled for 30 s after each send and labeled "Send a new code in 0:24" (countdown not announced); on send the live region says "New code sent. The old one no longer works."

| Case | Message |
|---|---|
| fewer than 6 digits | "Enter all 6 digits." |
| `invalid_code` | "That code doesn't match. {n} tries left." ("1 try left") |
| `too_many_attempts` (5 wrong) | "Too many wrong codes. Send a new code to try again." Verify disabled until a new code. |
| `code_expired` | "This code expired. Send a new code." |
| `challenge_not_found` | "That code was replaced by a newer one. Use the latest code." |

**After verify.** New account: go to `/profile/setup` with `state.welcome = first name`; the form starts empty except the name (team chat: UF email), drafts saved by another account are ignored, and focus goes to the setup heading. The stored profile only changes on Finish. Existing account: go back to the page whose sign-in prompt sent them (`location.state.from`, in-app paths only; a new account's profile setup goes there after Finish), else to `/find`; top bar live region says "Signed in as {email}." (Sign-up with an existing address: "Welcome back. You already had an account, so you're signed in."). Prototype: `name`, `email` and `emailVerified: true` replace the demo viewer's; the rest of the demo profile stays so the scenario still works. Phone: full-width card with the 16 px gutter, full-width buttons, no horizontal scroll.

### 4.6 Top bar and Landing

- Signed in: last item in `.topnav-actions` is an account button (viewer Avatar 32, `aria-label="Account: {email}"`, `aria-expanded`, `aria-controls`). It opens a disclosure panel (not `role="menu"`), right-aligned, width `min(260px, 100vw - 32px)`: name, email, "✓ UF email verified" (or "Email not verified"), link "Edit profile", button "Sign out". Esc or an outside click closes it and returns focus to the button; it closes when focus leaves.
- Signed out: link "Sign up" (`btn btn-primary btn-sm btn-pill`) and, above 560 px, ghost link "Sign in". Sign out (prototype) only flips the session: pages keep working with the demo data, Contact cards show the Signed out state, focus goes to "Sign up", live region says "Signed out."
- ≤ 560 px: the account button stays 32 px. If the bar still overflows at 360 px, the brand text becomes sr-only and the mark stays.
- Landing: eyebrow "For UF course project teams"; under the hero CTAs a line "UF students only. New here? **Sign up with your UF email**" (link to `/signup`); step 3 text "Invite the right people, email them once you've both said yes, and leave reviews when the project ends."

## 5. Data and API contract

```ts
export type Channel = 'email' | 'discord' | 'slack' | 'text' // "Preferred team chat"; shown only, never a match check
export interface Student { /* …unchanged fields… */
  /** Only on your own record (GET /api/me). Others' emails come from GET /api/students/:id/contact. */
  email?: string
  emailVerified: boolean
  channel: Channel
} // removed: contactHandle. Team/Project: channelLink removed.
export interface Contact { studentId: string; email: string; sharedProjectIds: string[] }
export type SessionStatus = 'signed_in' | 'signed_out'
export interface EmailChallenge { challengeId: string; email: string; expiresAt: string; resendAfter: string; demoCode?: string }
export interface VerifyResult { me: Student; isNewAccount: boolean }
```
Labels: `CHANNEL_LABEL = { email: 'UF email', discord: 'Discord', slack: 'Slack', text: 'Group text' }`. `api/index.ts` adds a `send<T>(method, path, body, mock)` helper and an `ApiError` class (fields declared explicitly, no parameter properties) carrying `status`, `code` and the body. Functions: `startEmailCode`, `verifyEmailCode`, `signOut`, `contact(id)`. `AppData` adds `session`, `signOut()`, `applySignIn(result)` and `getContact(id)` (cached per id, cache cleared on sign-out).

| Method | Path | Request | 200 | Errors (`{ "error": code, "message": text, …extra }`) |
|---|---|---|---|---|
| POST | `/api/auth/email-code` | `{ "email": "alex.chen@ufl.edu", "name": "Alex Chen" }` (name optional) | `{ "challengeId": "ch_8f2k", "email": "alex.chen@ufl.edu", "expiresAt": "2026-10-19T18:10:00Z", "resendAfter": "2026-10-19T18:00:30Z" }` (+ `"demoCode": "482913"` in demo mode only) | 422 `invalid_email` · 422 `not_ufl_email` · 429 `rate_limited` `{ "retryAfter": 300 }` |
| POST | `/api/auth/verify` | `{ "challengeId": "ch_8f2k", "code": "482913" }` | `{ "me": Student, "isNewAccount": true }` + session cookie | 400 `invalid_code` `{ "attemptsLeft": 4 }` · 404 `challenge_not_found` · 410 `code_expired` · 429 `too_many_attempts` |
| POST | `/api/auth/signout` | none | 204 | none |
| GET | `/api/me` | none | Student with `email` | 401 `not_signed_in` |
| GET | `/api/students/:id/contact` | none | `{ "studentId": "jordan", "email": "jordan.lee.demo@ufl.edu", "sharedProjectIds": ["t1"] }` | 401 `not_signed_in` · 403 `contact_locked` · 404 `not_found` |

Server-enforced rules: (1) `email` never appears in `/api/students`, `/api/students/:id`, team posts, project member lists or any other student payload. (2) The contact endpoint returns 403 unless viewer and student share a project in `memberIds`; pending invites or requests don't count; access ends when no shared project remains. (3) Re-validate every address: trim, lowercase, `^[a-z0-9._%+-]{1,64}@ufl\.edu$`. (4) Codes: 6 random digits, stored hashed, single use, expire after 10 min, 5 wrong tries per challenge, a new code voids the old one; rate limit 1 code per 30 s and 5 per hour per address. (5) No account enumeration: `email-code` answers the same for new and existing addresses; `isNewAccount` is revealed only after a correct code; a new account without a name gets `name: ""` and the client sends it to profile setup. (6) `demoCode` only when an explicit demo flag is on; never log codes. (7) Session cookie `HttpOnly; Secure; SameSite=Lax`; `emailVerified` becomes true only through `verify`.

## 6. Mock data plan

- Move every candidate's `email` out of `STUDENTS` into `export const MOCK_EMAILS: Record<string, string>` in `data/mock.ts` (the "server-only" table). Use clearly fake local parts so a demo click can't email a real student: `<first>.<last>.demo@ufl.edu` (e.g. `priya.raman.demo@ufl.edu`, `tomas.rivera.demo@ufl.edu`). `ME` keeps `email: 'you@ufl.edu'`, `emailVerified: true`.
- Delete `contactHandle: 'priya.r'` and `TEAM.channelLink`. Keep the `channel` values (ME discord; Daniel and Hannah slack; Lena email; Grace text) as team-chat preferences.
- Mock `api.contact(id)` enforces the same unlock rule as the server: `401 not_signed_in` when signed out, `403 contact_locked` unless you and the student share a project, else `MOCK_EMAILS[id]`. The UI still calls it only when the unlock rule passes. Mock auth keeps one module-level challenge: random 6-digit `demoCode`, `expiresAt` +10 min, `resendAfter` +30 s, 5 attempts; `isNewAccount` = a name was sent. Session starts `signed_in`.
- Scenario check (Database Project current): removing the channel check only removes Daniel's "Prefers Slack" warning, so Daniel now misses one check (reply time). Priya still passes every check; Marcus (time), Kai (goal) and Omar (reply) are unchanged. Open teams has no channel or email logic, so its best fit is unchanged.
- Demo paths: locked = `/people/priya`; unlocked = `/people/jordan`; live unlock = invite Priya from her profile.

## 7. Acceptance criteria

- **CT-01** In code: no `STUDENTS` entry in `src/data/mock.ts` has an `email` field (emails live only in `MOCK_EMAILS`, all ending `.demo@ufl.edu`); `contactHandle` and `channelLink` appear nowhere in `src/`; `grep -rn "Discord" frontend/src` matches only the `discord: 'Discord'` label; `docs/data-model.md` documents `Contact`, the five endpoints in section 5 and the seven server rules.
- **CT-02** With default data, `/people/priya` shows "Their UF email appears here once they accept your invite to Database Project. Until then, neither of you can see the other's email." and `document.querySelector('main').innerHTML` contains no "priya.raman".
- **CT-03** `/people/jordan` shows the Contact card first in the grid with `jordan.lee.demo@ufl.edu` as selectable text, a "Copy email" button and an "Email Jordan" link whose href is exactly `mailto:jordan.lee.demo@ufl.edu?subject=Database%20Project%20(Database%20Systems)%20-%20Teammate%20Finder`.
- **CT-04** Clicking "Copy email" puts the address on the clipboard, the button reads "Copied ✓" for about 2 s, and a polite live region says "Email address copied."; when `navigator.clipboard.writeText` is stubbed to reject, the address text is selected and the status reads "Selected. Press Ctrl+C or ⌘C to copy."
- **CT-05** Clicking "Invite to Database Project" on `/people/priya` swaps the locked text for Priya's address within 1 s without reload, focus lands on the Contact heading, and the live region says "Priya joined Database Project. Their UF email is now shown."
- **CT-06** `/team` has no "Team Discord" button; "Email the team" links to a mailto with every other member's address; the Contact card lists each other member with Copy and Email; after removing Jordan, Jordan's row disappears and `/people/jordan` shows the locked text; a project with only the viewer shows "No teammates yet. When someone accepts your invite, their UF email shows up here." and no "Email the team".
- **CT-07** `/profile/setup` has no handle field; the Communication card has a "Preferred team chat" select with options UF email, Discord, Slack, Group text and the help text from 4.3; The basics shows "UF email", `you@ufl.edu` and "✓ Verified".
- **CT-08** On `/find` with Database Project current, no card shows a "Prefers …" check, Priya is the only candidate whose checks are all good, and profile cards, profile detail and the compare tray label the preference "Team chat".
- **SU-01** On `/signup`, name "Alex Chen" and email "  Alex.Chen@UFL.edu " plus "Send code" (or Enter) shows step 2 with "alex.chen@ufl.edu" in the sub text and focus on the "Enter your 6-digit code" heading.
- **SU-02** `alex@gmail.com`, `alex@cise.ufl.edu`, `alex` and an empty email each keep the form on step 1 and show the matching message from the 4.5 table; the input gets `aria-invalid="true"`, the message is referenced by `aria-describedby`, and focus moves to the first invalid field.
- **SU-03** Step 2 shows "Prototype: no email is sent." and a 6-digit demo code; "Use demo code" fills the field; pasting "482 913" leaves "482913"; 5 digits gives "Enter all 6 digits."; a wrong code gives "That code doesn't match. 4 tries left."
- **SU-04** After 5 wrong codes Verify is disabled and "Too many wrong codes. Send a new code to try again." shows; "Send a new code" is disabled with a countdown for 30 s after each send, then issues a new demo code and the old code is rejected.
- **SU-05** The correct code on `/signup` leads to `/profile/setup` with the banner "Email verified. Welcome, Alex! Next, tell teammates how you work.", Name "Alex Chen" and UF email `alex.chen@ufl.edu` with "✓ Verified"; the top bar account button's label is "Account: alex.chen@ufl.edu".
- **SU-06** The whole sign-up works with keyboard only (Tab, Enter, Space), every control has a visible label and focus ring, at 390 px there is no horizontal scroll and inputs use font-size of at least 16 px, and in Classic, Aurora, Glass and Soft the errors and the demo-code box meet WCAG AA contrast.
- **SU-07** The account button opens a panel with name, email, "✓ UF email verified", "Edit profile" and "Sign out"; Esc closes it and returns focus to the button; after "Sign out" the top bar shows "Sign up" (plus "Sign in" above 560 px), `/find` and `/team` still load, and `/people/jordan` shows "Sign in with your UF email to see contact details."
- **SU-08** Landing shows "UF students only. New here? Sign up with your UF email" linking to `/signup`; `/signin` has no name field and a correct code leads to `/find`; with `VITE_API_URL` set, the sign-in flow calls `POST /api/auth/email-code` and `POST /api/auth/verify` with the JSON bodies in section 5.

## 8. Edge cases

- `alex+tf@ufl.edu` is accepted; `alex@@ufl.edu`, spaces inside, and local parts over 64 characters are "not an address".
- A teammate on both the current and another project: the subject names the current project; "You're teammates in A and B."
- Clipboard blocked (permissions, insecure context): select-text fallback. No mail app: nothing opens, so the helper text points to Copy.
- Removing a member re-locks their email in the UI; an address already copied can't be taken back (accepted).
- A full project: the locked text explains it; the email stays hidden.
- Refreshing on step 2 restarts at step 1 (the challenge isn't persisted). Browser Back leaves the page; "Change email" is the in-page back.
- Long addresses wrap (`overflow-wrap: anywhere`) and never cause horizontal scroll.
- Signing up while signed in replaces the demo identity (note shown in step 1).

## 9. Dependencies and open questions (default chosen)

- **PM-C, projects.** I assume AppData exposes the viewer's projects (each with accepted-only `memberIds`) and a current project; the unlock rule and mail subject read them. If PM-C adds pending invites: pending doesn't unlock and the card says "Invite sent. Their UF email appears here once they accept." The second mock project should not include Priya, Marcus, Sofia, Daniel, Kai or Omar (an unlocked email would set them apart in the study); any new fictional members need `MOCK_EMAILS` entries. The "New project" form has no chat-link field. Order in `.topnav-actions`: project switcher, Style, account.
- **PM-C, invite flow.** CT-05 needs the invite handler on the profile page to hand focus to the Contact heading, because the invite buttons disappear on accept.
- **PM-A, matching.** Dropping the channel check edits `lib/matching.ts`, which PM-A also changes for hours; one developer should own that file. Note for the lead: Sofia already misses two checks today (goal and reply), independent of this change.
- **Open: UF subdomains** (`@cise.ufl.edu`)? Default: rejected with the "Did you mean" hint, as D3 says "ends in @ufl.edu".
- **Open: keep the team-chat preference at all?** Default: keep it, informational only, default "UF email".
- **Open: separate sign-in?** Default: yes, `/signin` mode of the same page, so the backend has a complete auth flow.

## 10. Report notes

- F3/U3 → contact by UF email with Copy and an "Email {name}" link instead of a team Discord link or in-app chat: everyone has the address (Luka), and it avoids the high-risk messaging build we flagged at the proposal stage.
- U3 + privacy → the email unlocks only when both sides have agreed to work together, and the locked state says exactly when it unlocks; the server, not the UI, enforces it.
- U3 → "Preferred channel" became an optional "Preferred team chat" and no longer counts against a candidate, so students without Discord aren't marked as a worse fit.
- F5/U5 → UF-only sign-up with an @ufl.edu address and a 6-digit code; errors explain why other addresses are rejected and suggest the fix for near misses.
- Clean, easy UI (class positive) kept: two short steps, one field per decision, the same field and banner styles as profile setup.
