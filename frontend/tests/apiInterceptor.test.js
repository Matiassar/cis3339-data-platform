// Tests for the Axios response interceptor in src/api/api.js (F2).
// A tiny fake HTTP server stands in for the backend, so these tests never touch
// the team's real backend or database.
// Run with: npm test   (from the frontend folder)
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import http from 'node:http'

// The interceptor loads the Pinia store and the router only when a 401 happens.
// Replace them with simple fakes so we can check what it did.
const resetSession = vi.fn()
const redirect = vi.fn()
vi.mock('../src/store/loggedInUser', () => ({
  useLoggedInUserStore: () => ({ $reset: resetSession })
}))
vi.mock('../src/router', () => ({
  default: {
    currentRoute: { value: { path: '/findclient', fullPath: '/findclient' } },
    push: redirect
  }
}))

// Minimal localStorage, since tests run in Node instead of a browser
const storage = {}
globalThis.localStorage = {
  getItem: (key) => (key in storage ? storage[key] : null),
  setItem: (key, value) => {
    storage[key] = String(value)
  },
  removeItem: (key) => {
    delete storage[key]
  }
}

// Fake backend: each path returns a different kind of response
const PORT = 4555
let server
let api

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/users/login') return send(res, 400, { message: 'Invalid username or password' })
    if (req.url === '/clients') return send(res, 200, [{ firstName: 'Ana' }])
    if (req.url === '/events/') return send(res, 401, { message: 'Token is not valid' })
    if (req.url === '/org') return send(res, 400, 'Organization not found', 'text/plain')
    if (req.url === '/services/') return send(res, 500, {})
    send(res, 404, { message: 'Not found' })
  })
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve))
  api = await import('../src/api/api')
})

afterAll(() => new Promise((resolve) => server.close(resolve)))

beforeEach(() => {
  resetSession.mockClear()
  redirect.mockClear()
})

describe('API error interceptor', () => {
  it('passes successful responses through unchanged', async () => {
    await expect(api.getClients()).resolves.toEqual([{ firstName: 'Ana' }])
  })

  it('turns a server error into an Error with the server message', async () => {
    await expect(api.loginUser('admin', 'wrong')).rejects.toMatchObject({
      message: 'Invalid username or password',
      status: 400
    })
  })

  it('handles plain-text error bodies', async () => {
    await expect(api.getOrgName()).rejects.toThrow('Organization not found')
  })

  it('gives a readable message when the server sends no message', async () => {
    await expect(api.getServices()).rejects.toMatchObject({
      message: 'Request failed (500)',
      status: 500
    })
  })

  it('a failed login does not trigger the logout redirect', async () => {
    await api.loginUser('admin', 'wrong').catch(() => {})
    expect(redirect).not.toHaveBeenCalled()
  })

  it('on 401: clears the token and session and redirects to /login', async () => {
    localStorage.setItem('authToken', 'expired-token')

    await expect(api.getEvents()).rejects.toMatchObject({ status: 401 })

    expect(localStorage.getItem('authToken')).toBeNull()
    expect(resetSession).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/findclient' }
    })
  })

  it('when the backend is down: "Unable to reach the server"', async () => {
    await new Promise((resolve) => server.close(resolve))
    server = http.createServer() // so afterAll can still close something

    const error = await api.getClients().catch((err) => err)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Unable to reach the server')
    expect(String(error)).not.toContain('[object Object]')
  })
})
