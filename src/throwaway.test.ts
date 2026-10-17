import { expect, test } from 'vitest'

test('matches a throwaway snapshot', () => {
  expect({ throwaway: true }).toMatchSnapshot()
})
