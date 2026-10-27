// Unit tests for the useApi composable (F2).
// Run with: npm test   (from the frontend folder)
import { describe, it, expect } from 'vitest'
import { useApi } from '../src/composables/useApi'

// Helper: a promise we can resolve later, to check state while a request is in flight
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useApi', () => {
  it('starts empty: no data, not loading, no error', () => {
    const { data, loading, error } = useApi(() => Promise.resolve([]))

    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('success: loading is true while waiting, then data holds the result', async () => {
    const request = deferred()
    const { data, loading, error, execute } = useApi(() => request.promise)

    const running = execute()
    expect(loading.value).toBe(true)
    expect(data.value).toBeNull()

    request.resolve([{ name: 'Ana' }, { name: 'Luis' }])
    const returned = await running

    expect(loading.value).toBe(false)
    expect(data.value).toEqual([{ name: 'Ana' }, { name: 'Luis' }])
    expect(error.value).toBeNull()
    expect(returned).toEqual([{ name: 'Ana' }, { name: 'Luis' }])
  })

  it('failure: error is a readable string, data stays null, loading ends', async () => {
    const { data, loading, error, execute } = useApi(() =>
      Promise.reject(new Error('Unable to reach the server'))
    )

    const returned = await execute()

    expect(error.value).toBe('Unable to reach the server')
    expect(typeof error.value).toBe('string')
    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(returned).toBeNull() // execute() never throws, so pages don't need try/catch
  })

  it('failure without a message falls back to a generic string', async () => {
    const { error, execute } = useApi(() => Promise.reject({}))

    await execute()

    expect(error.value).toBe('Something went wrong')
  })

  it('retry: calling execute() again clears the old error and loads the data', async () => {
    let attempt = 0
    const { data, error, execute } = useApi(() => {
      attempt++
      return attempt === 1
        ? Promise.reject(new Error('Unable to reach the server'))
        : Promise.resolve(['recovered'])
    })

    await execute()
    expect(error.value).toBe('Unable to reach the server')

    await execute() // what the Retry button does
    expect(error.value).toBeNull()
    expect(data.value).toEqual(['recovered'])
  })

  it('an error after a success clears the old data, so no stale rows stay on screen', async () => {
    let fail = false
    const { data, error, execute } = useApi(() =>
      fail ? Promise.reject(new Error('Server error')) : Promise.resolve(['old row'])
    )

    await execute()
    expect(data.value).toEqual(['old row'])

    fail = true
    await execute()
    expect(data.value).toBeNull()
    expect(error.value).toBe('Server error')
  })

  it('passes arguments from execute() to the API call (used by searches)', async () => {
    const { data, execute } = useApi((query) => Promise.resolve(`searched ${query.name}`))

    await execute({ name: 'Ana' })

    expect(data.value).toBe('searched Ana')
  })

  it('a slow older request never overwrites a newer one', async () => {
    const first = deferred()
    const second = deferred()
    const requests = [first, second]
    const { data, loading, execute } = useApi(() => requests.shift().promise)

    const firstRun = execute() // e.g. search "A"
    const secondRun = execute() // user quickly searches "Ana"

    second.resolve('results for Ana')
    await secondRun
    expect(data.value).toBe('results for Ana')
    expect(loading.value).toBe(false)

    first.resolve('results for A') // the old request finishes late
    await firstRun
    expect(data.value).toBe('results for Ana')
  })
})
