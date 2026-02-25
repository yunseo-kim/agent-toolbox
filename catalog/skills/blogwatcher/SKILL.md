---
name: blogwatcher
description: >
  Monitor blogs and RSS/Atom feeds for updates using the blogwatcher CLI.
  Track new articles, mark as read, and manage blog subscriptions.
license: Sustainable Use License 1.0

metadata:
  domain: productivity
  tags: "rss, atom, blog, feed-reader, monitoring, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# blogwatcher

Track blog and RSS/Atom feed updates with the `blogwatcher` CLI.

Install

- Go: `go install github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest`

Quick start

- `blogwatcher --help`

Common commands

- Add a blog: `blogwatcher add "My Blog" https://example.com`
- List blogs: `blogwatcher blogs`
- Scan for updates: `blogwatcher scan`
- List articles: `blogwatcher articles`
- Mark an article read: `blogwatcher read 1`
- Mark all articles read: `blogwatcher read-all`
- Remove a blog: `blogwatcher remove "My Blog"`

Example output

```
$ blogwatcher blogs
Tracked blogs (1):

  xkcd
    URL: https://xkcd.com
```

```
$ blogwatcher scan
Scanning 1 blog(s)...

  xkcd
    Source: RSS | Found: 4 | New: 4

Found 4 new article(s) total!
```

Notes

- Use `blogwatcher <command> --help` to discover flags and options.
