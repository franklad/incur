---
'incur': minor
---

- Added middleware support via `cli.use()`.
- Added typed dependency injection via `vars`: declare a Zod schema on `create()` (and optionally set defaults), set values with `c.set()` in middleware, read them via `c.var` in handlers.
