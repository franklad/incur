---
title: gh pr
description: Manage pull requests. Create a pull request, List pull requests in a repository, Merge a pull request, View a pull request
command: gh pr
---

# gh pr create

Create a pull request

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | yes |  |

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--body` | `string` |  |  |
| `--draft` | `boolean` | `false` |  |
| `--base` | `string` | `main` |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | `number` | yes |  |
| `url` | `string` | yes |  |

---

# gh pr list

List pull requests in a repository

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--state` | `string` | `open` |  |
| `--limit` | `number` | `30` |  |
| `--label` | `array` |  |  |
| `--json` | `boolean` | `false` |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | `array` | yes |  |
| `items[].number` | `number` | yes |  |
| `items[].title` | `string` | yes |  |
| `items[].state` | `string` | yes |  |
| `items[].author` | `string` | yes |  |
| `totalCount` | `number` | yes |  |

---

# gh pr merge

Merge a pull request

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `number` | `number` | yes |  |

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--method` | `string` | `merge` |  |
| `--deleteBranch` | `boolean` | `false` |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `merged` | `boolean` | yes |  |

---

# gh pr view

View a pull request

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `number` | `number` | yes |  |

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--web` | `boolean` | `false` |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | `number` | yes |  |
| `title` | `string` | yes |  |
| `body` | `string` | yes |  |
| `state` | `string` | yes |  |
| `mergeable` | `boolean` | yes |  |
