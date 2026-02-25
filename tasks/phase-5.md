# Phase 5: Formatter — Output Formats

## Design

Add a `format` parameter to `Formatter.format()` supporting `'toon' | 'json' | 'yaml' | 'md'`. Wire into `Cli.ts` via `--format <fmt>` and `--json` shorthand flags, extracted from argv before command parsing (alongside `--verbose`).

### Markdown rules

- **Flat object** → key-value table (`| Key | Value |`)
- **Array of objects** → columnar table (keys as headers, rows as items)
- **Scalar** → just the value
- **Mixed top-level** (tables + scalars + nested) → `##` headings per key
- **Nested objects** → recurse until leaf, heading is `##` with dot-delimited path (e.g. `## config.db`)

### Deferred

- **`jsonl`** — streaming format, deferred to Phase 10.
- **`schemaVersion`** — deferred to Phase 7 (Schema).

---

## TDD Cycles

### Cycle 1: `format(value, 'toon')` — explicit TOON

**Red** (`Formatter.test.ts`):
```ts
test('formats as TOON (explicit)', () => {
  const result = Formatter.format({ message: 'hello' }, 'toon')
  expect(result).toMatchInlineSnapshot(`"message: hello"`)
})
```

**Green**: Add `format` parameter with `'toon'` default. Existing behavior unchanged.

---

### Cycle 2: `format(value, 'json')` — JSON output

**Red**:
```ts
test('formats as JSON', () => {
  const result = Formatter.format({ message: 'hello' }, 'json')
  expect(JSON.parse(result)).toEqual({ message: 'hello' })
})
```

**Green**: `JSON.stringify(value, null, 2)`.

---

### Cycle 3: `format(value, 'yaml')` — YAML output

**Red**:
```ts
test('formats as YAML', () => {
  const result = Formatter.format({ message: 'hello' }, 'yaml')
  expect(result).toMatchInlineSnapshot(`
    "message: hello
    "
  `)
})
```

**Green**: Use `yaml` package (`stringify`).

---

### Cycle 4: `format(value, 'md')` — flat object as key-value table

**Red**:
```ts
test('formats flat object as markdown key-value table', () => {
  const result = Formatter.format({ message: 'hello', status: 'ok' }, 'md')
  expect(result).toMatchInlineSnapshot(`
    "| Key | Value |
    |---|---|
    | message | hello |
    | status | ok |"
  `)
})
```

**Green**: Detect flat object (all values are scalars), render as `| Key | Value |` table.

---

### Cycle 5: `format(value, 'md')` — array of objects as columnar table

**Red**:
```ts
test('formats array of objects as markdown columnar table', () => {
  const result = Formatter.format({ items: [{ name: 'a', state: 'open' }, { name: 'b', state: 'closed' }] }, 'md')
  expect(result).toContain('| name | state |')
  expect(result).toContain('| a | open |')
})
```

---

### Cycle 6: `format(value, 'md')` — mixed top-level uses headings

**Red**:
```ts
test('formats mixed top-level with headings', () => {
  const result = Formatter.format({ items: [{ name: 'a' }], total: 2 }, 'md')
  expect(result).toMatchInlineSnapshot(`
    "## items

    | name |
    |---|
    | a |

    ## total

    2"
  `)
})
```

---

### Cycle 7: `format(value, 'md')` — nested objects use dot-delimited path heading

**Red**:
```ts
test('formats nested objects with dot-delimited path heading', () => {
  const result = Formatter.format({ config: { db: { host: 'localhost', port: 5432 } } }, 'md')
  expect(result).toMatchInlineSnapshot(`
    "## config.db

    | Key | Value |
    |---|---|
    | host | localhost |
    | port | 5432 |"
  `)
})
```

---

### Cycle 8: `format()` accepts string and scalar values

**Red**:
```ts
test('formats string value as-is', () => {
  expect(Formatter.format('hello world')).toBe('hello world')
  expect(Formatter.format('hello world', 'json')).toBe('"hello world"')
  expect(Formatter.format('hello world', 'md')).toBe('hello world')
})

test('formats number value', () => {
  expect(Formatter.format(42)).toBe('42')
  expect(Formatter.format(42, 'json')).toBe('42')
})
```

**Green**: Widen `format()` signature from `Record<string, unknown>` to `unknown`. Scalars render as their string value (TOON/md) or `JSON.stringify` (json).

---

### Cycle 9: Default format remains TOON

**Red**:
```ts
test('defaults to TOON when no format specified', () => {
  const result = Formatter.format({ message: 'hello' })
  expect(result).toMatchInlineSnapshot(`"message: hello"`)
})
```

**Green**: Already works from Cycle 1 default parameter.

---

### Cycle 10: `--format json` flag in Cli

**Red** (`Cli.test.ts`):
```ts
test('--format json outputs JSON data', async () => {
  const cli = Cli.create('test')
  cli.command('ping', { run: () => ({ pong: true }) })
  const { output } = await serve(cli, ['ping', '--format', 'json'])
  expect(JSON.parse(output)).toEqual({ pong: true })
})
```

**Green**: Extract `--format <value>` from argv before command parsing, pass to `Formatter.format()`.

---

### Cycle 11: `--json` shorthand

**Red** (`Cli.test.ts`):
```ts
test('--json is shorthand for --format json', async () => {
  const cli = Cli.create('test')
  cli.command('ping', { run: () => ({ pong: true }) })
  const { output } = await serve(cli, ['ping', '--json'])
  expect(JSON.parse(output)).toEqual({ pong: true })
})
```

**Green**: Check for `--json` flag, treat as `format = 'json'`.

---

### Cycle 12: `--verbose` + `--format json` — full envelope as JSON

**Red** (`Cli.test.ts`):
```ts
test('--verbose --format json outputs full envelope as JSON', async () => {
  const cli = Cli.create('test')
  cli.command('ping', { run: () => ({ pong: true }) })
  const { output } = await serve(cli, ['ping', '--verbose', '--format', 'json'])
  const parsed = JSON.parse(output)
  expect(parsed.ok).toBe(true)
  expect(parsed.data).toEqual({ pong: true })
  expect(parsed.meta.command).toBe('ping')
})
```

---

### Cycle 13: Error output respects `--format`

**Red** (`Cli.test.ts`):
```ts
test('error output respects --format json', async () => {
  const cli = Cli.create('test')
  cli.command('fail', { run() { throw new Error('boom') } })
  const { output, exitCode } = await serve(cli, ['fail', '--format', 'json'])
  expect(exitCode).toBe(1)
  const parsed = JSON.parse(output)
  expect(parsed.code).toBe('UNKNOWN')
  expect(parsed.message).toBe('boom')
})
```

---

### Cycle 14: Verify all tests pass

- `pnpm test` — all pass
- `pnpm check:types` — no errors
- `pnpm check` — lint passes

---

## Files Changed

| File | Change |
|---|---|
| `Formatter.ts` | Add `format` parameter (`'toon' | 'json' | 'yaml'`) |
| `Formatter.test.ts` | Tests for explicit toon, json, yaml formats |
| `Cli.ts` | Extract `--format`/`--json` flags, pass format to `Formatter.format()` |
| `Cli.test.ts` | Tests for `--format json`, `--json`, `--verbose` + format combos |
