export const ACTIONS_WIDTH = 144

/** Decides where a swiped row settles when the finger is released. */
export function resolveSwipe(offset: number, width = ACTIONS_WIDTH): 'open' | 'closed' {
  return offset <= -width / 2 ? 'open' : 'closed'
}
