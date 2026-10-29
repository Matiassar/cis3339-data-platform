// Tests that register/deregister always give the page a readable message,
// whichever response shape the backend sends (current plain text, or the B1 contract).
// A tiny fake HTTP server stands in for the backend; no real database is used.
// Run with: npm test   (from the frontend folder)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'

// What the fake backend sends next, set by each test
let nextResponse = { status: 200, body: '', type: 'text/plain' }

let server
let api

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const { status, body, type } = nextResponse
    res.writeHead(status, { 'Content-Type': type })
    res.end(type === 'application/json' ? JSON.stringify(body) : body)
  })
  await new Promise((resolve) => server.listen(4555, '127.0.0.1', resolve))
  api = await import('../src/api/api')
})

afterAll(() => new Promise((resolve) => server.close(resolve)))

function respondWith(body, status = 200) {
  nextResponse =
    typeof body === 'string'
      ? { status, body, type: 'text/plain' }
      : { status, body, type: 'application/json' }
}

describe('registration responses (B1 contract)', () => {
  it('current backend: plain-text success is passed through', async () => {
    respondWith('Client added to event')
    await expect(api.registerAttendee('e1', 'c1')).resolves.toBe('Client added to event')
  })

  it('B1: { message: "Already registered" } becomes the message text', async () => {
    respondWith({ message: 'Already registered' })
    await expect(api.registerAttendee('e1', 'c1')).resolves.toBe('Already registered')
  })

  it('B1: { message: "Not registered" } becomes the message text', async () => {
    respondWith({ message: 'Not registered' })
    await expect(api.deregisterAttendee('e1', 'c1')).resolves.toBe('Not registered')
  })

  it('B1: a returned record (first successful call) gets a readable default', async () => {
    respondWith({ _id: 'e1', attendees: ['c1'] })
    await expect(api.registerAttendee('e1', 'c1')).resolves.toBe('Client registered for event')

    respondWith({ _id: 'e1', attendees: [] })
    await expect(api.deregisterAttendee('e1', 'c1')).resolves.toBe('Client removed from event')
  })

  it('errors still go through the interceptor (e.g. 404 from another organization)', async () => {
    respondWith({ error: 'Event not found' }, 404)
    await expect(api.registerAttendee('e1', 'c1')).rejects.toMatchObject({
      message: 'Event not found',
      status: 404
    })
  })
})
