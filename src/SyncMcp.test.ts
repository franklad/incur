import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { detectPackageSpecifier } from './SyncMcp.js'

let savedArgv1: string | undefined
let tmp: string

beforeEach(() => {
  savedArgv1 = process.argv[1]
  tmp = join(tmpdir(), `clac-test-${Date.now()}`)
  mkdirSync(join(tmp, 'node_modules', '.bin'), { recursive: true })
})

afterEach(() => {
  process.argv[1] = savedArgv1!
  rmSync(tmp, { recursive: true, force: true })
})

function setupPkg(deps: Record<string, string>) {
  writeFileSync(join(tmp, 'package.json'), JSON.stringify({ dependencies: deps }))
  process.argv[1] = join(tmp, 'node_modules', '.bin', 'my-cli')
}

test('returns bare name when argv[1] is undefined', () => {
  process.argv[1] = undefined as any
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns bare name when no node_modules in path', () => {
  process.argv[1] = '/usr/local/bin/my-cli'
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns bare name when package.json is missing', () => {
  process.argv[1] = join(tmp, 'node_modules', '.bin', 'my-cli')
  // no package.json written
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns bare name when dep is not found', () => {
  setupPkg({ other: '1.0.0' })
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns bare name when multiple deps exist', () => {
  setupPkg({ 'my-cli': '1.0.0', other: '2.0.0' })
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns URL specifier for https dep', () => {
  setupPkg({ 'my-cli': 'https://pkg.pr.new/my-cli@abc123' })
  expect(detectPackageSpecifier('my-cli')).toBe('https://pkg.pr.new/my-cli@abc123')
})

test('returns URL specifier for file: dep', () => {
  setupPkg({ 'my-cli': 'file:../local-cli' })
  expect(detectPackageSpecifier('my-cli')).toBe('file:../local-cli')
})

test('returns name@version for pinned version', () => {
  setupPkg({ 'my-cli': '1.2.3' })
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli@1.2.3')
})

test('returns bare name for range specifier', () => {
  setupPkg({ 'my-cli': '^1.0.0' })
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})

test('returns bare name for tag specifier', () => {
  setupPkg({ 'my-cli': 'latest' })
  expect(detectPackageSpecifier('my-cli')).toBe('my-cli')
})
