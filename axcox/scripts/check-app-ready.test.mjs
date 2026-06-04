import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  checkWebSocketReady,
  getServerInfo,
  waitForServerInfo,
} from './check-app-ready.mjs'

const originalFetch = globalThis.fetch
const tempRoots = []

function createTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-app-ready-'))
  tempRoots.push(root)
  return root
}

function writeServerInfo(filePath, info = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify({
    pid: 12345,
    port: 51721,
    host: 'localhost',
    origin: 'http://localhost:51721',
    projectRoot: info.projectRoot,
    startedAt: '2026-06-04T00:00:00.000Z',
    localIP: '127.0.0.1',
    ...info,
  }, null, 2), 'utf8')
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

describe('check-app-ready server info validation', () => {
  it('ignores stale dev server info when health cannot be reached', async () => {
    const projectRoot = createTempRoot()
    const infoPath = path.join(projectRoot, '.axhub/make/.dev-server-info.json')
    writeServerInfo(infoPath, { projectRoot })
    const logs = []
    globalThis.fetch = vi.fn(() => {
      throw new Error('connect ECONNREFUSED')
    })

    await expect(getServerInfo({
      devServerInfoPath: infoPath,
      projectRoot,
      logs,
    })).resolves.toBeNull()

    expect(logs.join('\n')).toContain('Ignoring stale dev server info')
  })

  it('ignores reachable runtime health from a different project root', async () => {
    const projectRoot = createTempRoot()
    const otherRoot = createTempRoot()
    const infoPath = path.join(projectRoot, '.axhub/make/.dev-server-info.json')
    writeServerInfo(infoPath, { projectRoot })
    globalThis.fetch = vi.fn(() => jsonResponse({
      ok: true,
      role: 'runtime',
      projectRoot: otherRoot,
      server: { projectRoot: otherRoot },
    }))

    await expect(getServerInfo({
      devServerInfoPath: infoPath,
      projectRoot,
      logs: [],
    })).resolves.toBeNull()
  })

  it('re-reads server info until the saved runtime becomes reachable', async () => {
    const projectRoot = createTempRoot()
    const infoPath = path.join(projectRoot, '.axhub/make/.dev-server-info.json')
    writeServerInfo(infoPath, { projectRoot })
    let attempts = 0
    globalThis.fetch = vi.fn(() => {
      attempts += 1
      if (attempts === 1) {
        throw new Error('connect ECONNREFUSED')
      }
      return jsonResponse({
        ok: true,
        role: 'runtime',
        projectRoot,
        server: { projectRoot },
      })
    })

    await expect(waitForServerInfo({
      devServerInfoPath: infoPath,
      projectRoot,
      timeoutMs: 100,
      pollIntervalMs: 1,
      logs: [],
    })).resolves.toMatchObject({
      port: 51721,
      host: 'localhost',
    })
    expect(attempts).toBe(2)
  })
})

describe('check-app-ready websocket readiness', () => {
  it('confirms websocket connected and ping/pong readiness', async () => {
    const sent = []

    class ReadyWebSocket extends EventEmitter {
      static OPEN = 1

      constructor(url) {
        super()
        this.url = url
        this.readyState = ReadyWebSocket.OPEN
        setTimeout(() => this.emit('message', JSON.stringify({ type: 'connected' })), 0)
      }

      send(data) {
        sent.push(JSON.parse(data))
        setTimeout(() => this.emit('message', JSON.stringify({ type: 'pong' })), 0)
      }

      close() {
        this.readyState = 3
      }
    }

    await expect(checkWebSocketReady({
      port: 51721,
      host: 'localhost',
    }, {
      WebSocketClass: ReadyWebSocket,
      timeoutMs: 50,
    })).resolves.toMatchObject({
      ok: true,
      url: 'ws://localhost:51721/ws?client=check-app-ready',
      connected: { type: 'connected' },
      pong: { type: 'pong' },
    })
    expect(sent).toEqual([{ type: 'ping' }])
  })

  it('returns a clear failure when websocket cannot connect', async () => {
    class BrokenWebSocket extends EventEmitter {
      static OPEN = 1

      constructor() {
        super()
        this.readyState = BrokenWebSocket.OPEN
        setTimeout(() => this.emit('error', new Error('ECONNREFUSED')), 0)
      }

      send() {}

      close() {
        this.readyState = 3
      }
    }

    await expect(checkWebSocketReady({
      port: 51721,
      host: 'localhost',
    }, {
      WebSocketClass: BrokenWebSocket,
      timeoutMs: 50,
    })).resolves.toMatchObject({
      ok: false,
      error: 'ECONNREFUSED',
    })
  })
})
