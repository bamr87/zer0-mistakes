---
name: giscus-conversation
description: "**WORKFLOW SKILL** — Read, draft, and post the GitHub Discussions that back the site's Giscus comment threads, so Claude Code can build conversations from page comments. USE FOR: reading the comment thread on a page, summarizing reader feedback, drafting a maintainer reply, replying to a specific comment, or seeding a discussion for a page that has none yet. INVOKES: scripts/bin/giscus-discussions (gh GraphQL engine), _config.yml (giscus.* config), pages/_docs/features/giscus-comments.md. DO NOT USE FOR: enabling/configuring the widget (edit _config.yml + see the feature doc), code/theme review (use /code-review), or content editing (use /content-review)."
---

# Giscus Conversation Builder

Comments on this site are stored as **GitHub Discussions** (via Giscus, mapped by
`pathname`). This skill drives [`scripts/bin/giscus-discussions`](../../../scripts/bin/giscus-discussions)
to read those threads, build a reply with the reader's context in mind, and
publish it — turning a page's comments into an actual conversation.

## When to use

- "What are people saying in the comments on `<page>`?" → read + summarize.
- "Draft a reply to the latest comment on `<post>`." → read → draft.
- "Reply to comment X thanking them and answering their question." → draft → post.
- "There's no discussion for this page yet — start one." → seed.

## Prerequisites

- An authenticated GitHub CLI: `gh auth status` (needs `repo`/`discussion` scope to post).
- Discussions enabled on the repo + the [Giscus app](https://github.com/apps/giscus)
  installed (required for the widget; the script only needs `gh`).
- The Giscus category id in `_config.yml` (`giscus.data-category-id`) must match a
  real category — verify with `giscus-discussions categories`.

## Inputs (source of truth)

| File | Provides |
| --- | --- |
| [`scripts/bin/giscus-discussions`](../../../scripts/bin/giscus-discussions) | The engine: `categories`, `list`, `thread`, `draft`, `seed`, `post` |
| [`_config.yml`](../../../_config.yml) (`giscus:` block) | Repo + category the comments live in |
| [`pages/_docs/features/giscus-comments.md`](../../../pages/_docs/features/giscus-comments.md) | Setup, configuration, and the conversation-building workflow |

## Pipeline

### 1. Locate the conversation

```bash
# All discussions in the Giscus category (page path = discussion title):
./scripts/bin/giscus-discussions list

# The thread for one page (by path, URL, or discussion number):
./scripts/bin/giscus-discussions thread --page /posts/2025/01/21/remote-work-revolution/
./scripts/bin/giscus-discussions thread --number 7 --json   # machine-readable
```

Read the rendered Markdown: original post, every comment, and nested replies.
Each comment/reply prints its node id (e.g. `DC_…`) — you need it to reply to a
specific comment.

### 2. Draft a reply (with context)

```bash
./scripts/bin/giscus-discussions draft --number 7 --out /tmp/giscus-reply.md
```

This writes a scaffold: the full thread as **context** (not posted) plus a
`===== REPLY =====` marker. Edit the section **below** the marker with the reply.
Write as the maintainer: acknowledge the commenter, answer concretely, keep the
project's voice. Only text below the marker is published.

### 3. Post (always preview first)

```bash
# Preview — calls no API:
./scripts/bin/giscus-discussions post --number 7 --body-file /tmp/giscus-reply.md --dry-run

# Reply to a specific comment instead of the thread root:
./scripts/bin/giscus-discussions post --number 7 --body-file /tmp/giscus-reply.md --reply-to DC_xxx --dry-run

# Publish (writes to public Discussions — confirm with the user first):
./scripts/bin/giscus-discussions post --number 7 --body-file /tmp/giscus-reply.md --reply-to DC_xxx
```

### 4. Seed a thread (only if the page has none)

Giscus auto-creates a discussion on the first visitor comment. To start one
yourself for a page that has no thread:

```bash
./scripts/bin/giscus-discussions seed --page /posts/new/ --title "/posts/new/" \
  --body "Discussion thread for this page." --dry-run
```

The title **must** equal the page's pathname so Giscus maps the widget to it.

## Rules of engagement

- **Posting and seeding write to public GitHub Discussions.** Always run with
  `--dry-run` first, show the rendered body, and get explicit user confirmation
  before the real call. Never post on the user's behalf unprompted.
- **One reply per intent.** Don't spray comments; compose one considered reply.
- **Stay in the project's voice** and only state things you can support from the
  thread, the page, or the repo. Don't invent commitments or roadmap promises.
- **Reply to the right node.** Use `--reply-to <comment id>` (from `thread`
  output) to thread under a specific comment; omit it for a top-level comment.
- The script reads the repo from `gh repo view` and the category from
  `_config.yml`; override with `--repo` / `--category-id` (or `GISCUS_REPO` /
  `GISCUS_CATEGORY_ID`) when working against a fork.

## Reporting back

After acting, report: which page/discussion, a one-line summary of the thread,
what you drafted, whether it was a dry-run or a real post, and the resulting
comment URL when published.
