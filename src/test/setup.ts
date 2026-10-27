import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from '../i18n'
import { server } from './server'

// Every request must be mocked: an unexpected call to the real API fails the test.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  document.querySelectorAll('.driver-popover, .driver-overlay').forEach((el) => el.remove())
})
afterAll(() => server.close())
