---
title: gh issue
description: Manage issues. Create a new issue, List issues in a repository, View an issue
command: gh issue
---

# gh issue create

Create a new issue

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | yes |  |

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--body` | `string` |  |  |
| `--label` | `array` |  |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | `number` | yes |  |
| `url` | `string` | yes |  |

---

# gh issue list

List issues in a repository

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--state` | `string` | `open` |  |
| `--limit` | `number` | `30` |  |
| `--label` | `array` |  |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | `array` | yes |  |
| `items[].number` | `number` | yes |  |
| `items[].title` | `string` | yes |  |
| `items[].state` | `string` | yes |  |

---

# gh issue view

View an issue

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `number` | `number` | yes |  |

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | `number` | yes |  |
| `title` | `string` | yes |  |
| `body` | `string` | yes |  |
| `state` | `string` | yes |  |
