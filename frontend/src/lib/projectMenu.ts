// Lets any page open the top-bar project switcher (D4) without importing the component,
// e.g. the "Change" button on Find teammates. ProjectSwitcher listens for this event.
export const OPEN_PROJECT_MENU_EVENT = 'tf:open-project-menu'

/** Opens the switcher menu on the current project. */
export function openProjectMenu() {
  window.dispatchEvent(new Event(OPEN_PROJECT_MENU_EVENT))
}
