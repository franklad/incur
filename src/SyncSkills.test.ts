import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Cli, SyncSkills } from 'incur'

let mockExecError: Error | null = null

vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: Function) => {
    if (mockExecError) cb(mockExecError, '', '')
    else cb(null, '', '')
  },
}))

let savedXdg: string | undefined

beforeEach(() => {
  mockExecError = null
  savedXdg = process.env.XDG_DATA_HOME
})

afterEach(() => {
  if (savedXdg === undefined) delete process.env.XDG_DATA_HOME
  else process.env.XDG_DATA_HOME = savedXdg
})

test('generates skill files to temp dir and calls runner', async () => {
  const cli = Cli.create('test', { description: 'A test CLI' })
  cli.command('ping', { description: 'Health check', run: () => ({ pong: true }) })
  cli.command('greet', { description: 'Say hello', run: () => ({ hi: true }) })

  const commands = Cli.toCommands.get(cli)!
  const result = await SyncSkills.sync('test', commands, {
    description: 'A test CLI',
    runner: 'npx',
  })

  expect(result.skills.length).toBeGreaterThan(0)
  expect(result.skills.map((s) => s.name)).toContain('greet')
  expect(result.skills.map((s) => s.name)).toContain('ping')
})

test('uses custom depth', async () => {
  const cli = Cli.create('test')
  cli.command('ping', { description: 'Ping', run: () => ({}) })
  cli.command('pong', { description: 'Pong', run: () => ({}) })

  const commands = Cli.toCommands.get(cli)!
  const result = await SyncSkills.sync('test', commands, { depth: 0, runner: 'npx' })

  // depth 0 = single skill
  expect(result.skills).toHaveLength(1)
})

test('propagates runner errors', async () => {
  mockExecError = new Error('skills not found')

  const cli = Cli.create('test')
  cli.command('ping', { run: () => ({}) })

  const commands = Cli.toCommands.get(cli)!
  await expect(SyncSkills.sync('test', commands, { runner: 'npx' })).rejects.toThrow(
    'skills not found',
  )
})

test('writes hash after successful sync', async () => {
  const tmp = join(tmpdir(), `clac-hash-test-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  process.env.XDG_DATA_HOME = tmp

  const cli = Cli.create('hash-test')
  cli.command('ping', { description: 'Health check', run: () => ({}) })

  const commands = Cli.toCommands.get(cli)!
  await SyncSkills.sync('hash-test', commands, { runner: 'npx' })

  const stored = SyncSkills.readHash('hash-test')
  expect(stored).toMatch(/^[0-9a-f]{16}$/)

  rmSync(tmp, { recursive: true, force: true })
})

test('readHash returns undefined when no hash exists', () => {
  const tmp = join(tmpdir(), `clac-hash-test-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  process.env.XDG_DATA_HOME = tmp

  expect(SyncSkills.readHash('nonexistent')).toBeUndefined()

  rmSync(tmp, { recursive: true, force: true })
})
