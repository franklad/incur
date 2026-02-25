# Phase 6: Subcommands — Group Composition

## Design

Introduce `Cli.command('name', { description })` as a module-level factory that creates a **Command group** — a container without a `run` handler that accepts sub-commands via `.command()`. Groups are mounted on a CLI (or nested inside other groups) via the overloaded `cli.command(group)` / `group.command(subGroup)`.

### Command group API

```ts
import { Cli, z } from 'clac'

// Create a group
const pr = Cli.command('pr', { description: 'PR management' })

// Register leaf sub-commands
pr.command('list', {
  options: z.object({ state: z.enum(['open', 'closed']).default('open') }),
  run: ({ options }) => ({ items: [], state: options.state }),
})

// Nest groups inside groups
const review = Cli.command('review', { description: 'Review operations' })
review.command('approve', { run: () => ({ approved: true }) })
pr.command(review)

// Mount on CLI
const cli = Cli.create('gh')
cli.command(pr)

// Routing
cli.serve(['pr', 'list'])              // → routes to pr > list
cli.serve(['pr', 'review', 'approve']) // → routes to pr > review > approve
```

### Routing

`serve()` walks the command tree token-by-token until it finds a leaf (has `run`). Remaining tokens go to `Parser.parse()`. The full path (e.g. `'pr review approve'`) is tracked for `meta.command`.

### Error cases

- **Unknown subcommand** → `COMMAND_NOT_FOUND`, message includes available sub-commands.
- **No subcommand** (group invoked bare) → `COMMAND_NOT_FOUND`, message lists available sub-commands.

### Types

The `Cli` type's `.command()` gains a second overload accepting `Command`. The `Command` type mirrors the same `.command()` overloads, returning `Command` for chaining.

```ts
type Cli = {
  name: string
  command: {
    <const args, const options, const output>(
      name: string,
      definition: CommandDefinition<args, options, output>,
    ): Cli
    (group: Command): Cli
  }
  serve(...): Promise<void>
}

type Command = {
  name: string
  description?: string | undefined
  command: {
    <const args, const options, const output>(
      name: string,
      definition: CommandDefinition<args, options, output>,
    ): Command
    (group: Command): Command
  }
}
```

### Internal storage

Use a `Symbol` brand on `Command` objects to distinguish groups from leaf `CommandDefinition`s in the shared `Map`. The Cli and Command both store children as `Map<string, CommandDefinition | Command>`.

### Deferred

- **`--help` for groups** — deferred to Phase 10.
- **Schema generation for nested commands** — deferred to Phase 7.

---

## TDD Cycles

### Cycle 1: `Cli.command()` creates a command group

**Red** (`Cli.test.ts`):
```ts
test('creates a command group with name and description', () => {
  const pr = Cli.command('pr', { description: 'PR management' })
  expect(pr.name).toBe('pr')
  expect(pr.description).toBe('PR management')
})
```

**Green**: Export `command()` factory and `Command` type from `Cli.ts`. Returns an object with `name`, `description`, and a `.command()` method. Internally holds a `Map` of children.

---

### Cycle 2: Group accepts sub-commands (chainable)

**Red**:
```ts
test('group registers sub-commands and is chainable', () => {
  const pr = Cli.command('pr', { description: 'PR management' })
  const result = pr.command('list', { run: () => ({ count: 0 }) })
  expect(result).toBe(pr)
})
```

**Green**: `.command(name, definition)` stores the definition in the internal Map, returns `this` for chaining.

---

### Cycle 3: Mount group on CLI and route to sub-command

**Red**:
```ts
test('routes to sub-command', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('list', { run: () => ({ count: 0 }) })
  cli.command(pr)

  const { output } = await serve(cli, ['pr', 'list'])
  expect(output).toMatchInlineSnapshot(`"count: 0"`)
})
```

**Green**:
- Overload `cli.command()` to accept a `Command` group (check `typeof firstArg !== 'string'`).
- In `serve()`, after looking up a command by name, check if it's a group (Symbol brand). If so, consume next token and look up sub-command. Loop until a leaf is found.
- Execute the leaf's `run` with parsed args/options.

---

### Cycle 4: Sub-command receives parsed args and options

**Red**:
```ts
test('sub-command receives parsed args and options', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('get', {
    args: z.object({ number: z.number() }),
    options: z.object({ verbose: z.boolean().default(false) }),
    run: ({ args, options }) => ({ pr: args.number, verbose: options.verbose }),
  })
  cli.command(pr)

  const { output } = await serve(cli, ['pr', 'get', '42', '--verbose'])
  expect(output).toMatchInlineSnapshot(`
    "pr: 42
    verbose: true"
  `)
})
```

**Green**: Already works if routing correctly passes remaining tokens to `Parser.parse()`.

---

### Cycle 5: `--verbose` shows full command path in meta

**Red**:
```ts
test('--verbose shows full command path in meta', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('list', { run: () => ({ count: 0 }) })
  cli.command(pr)

  const { output } = await serve(cli, ['pr', 'list', '--verbose'])
  expect(output).toMatchInlineSnapshot(`
    "ok: true
    data:
      count: 0
    meta:
      command: pr list
      duration: <stripped>"
  `)
})
```

**Green**: Build the command path string (e.g. `'pr list'`) during tree traversal, use it in `meta.command`.

---

### Cycle 6: Nested groups (3 levels deep)

**Red**:
```ts
test('routes to deeply nested sub-commands', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  const review = Cli.command('review', { description: 'Reviews' })
  review.command('approve', { run: () => ({ approved: true }) })
  pr.command(review)
  cli.command(pr)

  const { output } = await serve(cli, ['pr', 'review', 'approve'])
  expect(output).toMatchInlineSnapshot(`"approved: true"`)
})
```

**Green**: Recursive/loop routing from Cycle 3 already handles depth > 1.

---

### Cycle 7: Nested group shows correct command path in meta

**Red**:
```ts
test('nested group shows full path in verbose meta', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  const review = Cli.command('review', { description: 'Reviews' })
  review.command('approve', { run: () => ({ approved: true }) })
  pr.command(review)
  cli.command(pr)

  const { output } = await serve(cli, ['pr', 'review', 'approve', '--verbose'])
  expect(output).toMatchInlineSnapshot(`
    "ok: true
    data:
      approved: true
    meta:
      command: pr review approve
      duration: <stripped>"
  `)
})
```

---

### Cycle 8: Unknown subcommand error with available commands

**Red**:
```ts
test('unknown subcommand lists available commands', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('list', { run: () => ({}) })
  pr.command('create', { run: () => ({}) })
  cli.command(pr)

  const { output, exitCode } = await serve(cli, ['pr', 'unknown'])
  expect(exitCode).toBe(1)
  expect(output).toMatchInlineSnapshot(`
    "code: COMMAND_NOT_FOUND
    message: "Unknown subcommand: unknown. Available: list, create""
  `)
})
```

**Green**: When a subcommand token doesn't match any child in the group, build an error including the sorted list of available child names.

---

### Cycle 9: No subcommand provided for group

**Red**:
```ts
test('group without subcommand lists available commands', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('list', { run: () => ({}) })
  pr.command('create', { run: () => ({}) })
  cli.command(pr)

  const { output, exitCode } = await serve(cli, ['pr'])
  expect(exitCode).toBe(1)
  expect(output).toMatchInlineSnapshot(`
    "code: COMMAND_NOT_FOUND
    message: "No subcommand provided for pr. Available: create, list""
  `)
})
```

**Green**: When a group is matched but no next token exists, list available sub-commands (sorted alphabetically).

---

### Cycle 10: Sub-commands from separate function (module pattern)

**Red**:
```ts
test('sub-commands from separate module can be mounted', async () => {
  function createPrCommands() {
    const pr = Cli.command('pr', { description: 'PR management' })
    pr.command('list', { run: () => ({ count: 0 }) })
    return pr
  }

  const cli = Cli.create('test')
  cli.command(createPrCommands())

  const { output } = await serve(cli, ['pr', 'list'])
  expect(output).toMatchInlineSnapshot(`"count: 0"`)
})
```

**Green**: Already works — validates the composability pattern.

---

### Cycle 11: Error in sub-command `run()` wraps correctly

**Red**:
```ts
test('error in sub-command wraps in error envelope', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('fail', {
    run() {
      throw new Error('sub-boom')
    },
  })
  cli.command(pr)

  const { output, exitCode } = await serve(cli, ['pr', 'fail'])
  expect(exitCode).toBe(1)
  expect(output).toMatchInlineSnapshot(`
    "code: UNKNOWN
    message: sub-boom"
  `)
})
```

**Green**: Routing reaches the leaf → existing try/catch wraps the error in an envelope. `meta.command` should be `'pr fail'`.

---

### Cycle 12: Group error respects `--format json`

**Red**:
```ts
test('group error respects --format json', async () => {
  const cli = Cli.create('test')
  const pr = Cli.command('pr', { description: 'PR management' })
  pr.command('list', { run: () => ({}) })
  cli.command(pr)

  const { output, exitCode } = await serve(cli, ['pr', 'unknown', '--format', 'json'])
  expect(exitCode).toBe(1)
  const parsed = JSON.parse(output)
  expect(parsed.code).toBe('COMMAND_NOT_FOUND')
  expect(parsed.message).toContain('unknown')
})
```

**Green**: Should work since `--format` is extracted before routing, and error output already uses `Formatter.format()`.

---

### Cycle 13: Verify all tests pass

- `pnpm test` — all pass
- `pnpm check:types` — no errors
- `pnpm check` — lint passes

---

## Files Changed

| File | Change |
|---|---|
| `Cli.ts` | Add `Command` type, `command()` factory, `command.Options` namespace, overloaded `cli.command()`, recursive routing in `serve()` |
| `Cli.test.ts` | Add `describe('subcommands')` with tests for group creation, routing, nesting, error cases, format flag |
