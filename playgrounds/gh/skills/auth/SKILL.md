---
title: gh auth
description: Authenticate with GitHub. Authenticate with a GitHub host, View authentication status
command: gh auth
---

# gh auth login

Authenticate with a GitHub host

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--hostname` | `string` | `github.com` |  |
| `--web` | `boolean` | `false` |  |
| `--scopes` | `array` |  |  |

---

# gh auth status

View authentication status

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--hostname` | `string` | `github.com` |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loggedIn` | `boolean` | yes |  |
| `hostname` | `string` | yes |  |
