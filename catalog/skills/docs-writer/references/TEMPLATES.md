# Templates

Reusable templates for document structure, common documentation patterns, and
example output formatting.

## Documentation Structure

### Project README template

```markdown
# Project Name
[One-line description]

## Features
- [Key features]

## Installation
[Minimal install steps]

## Quick Start
[Smallest working example]

## Usage
[Common use cases]

## API Reference
[If applicable]

## Configuration
[Optional settings]

## Troubleshooting
[Common issues and fixes]

## Contributing
[How to contribute]

## License
```

### API reference template

```markdown
## Function/Endpoint Name

[What it does and why it matters]

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | string | Yes | Purpose |

### Returns
[Return shape and meaning]

### Example
```language
[Complete working example]
```

### Errors
| Code | Description | Solution |
|------|-------------|----------|
```

### Tutorial template

```markdown
# [What You Will Build]

[Outcome and why this is useful]

## Prerequisites
- [Required knowledge]
- [Required software]

## Step 1: [First Action]
[Instructions and example]

## Step 2: [Next Action]
[Continue step by step]

## Next Steps
[Related follow-up paths]
```

## Common Patterns

### Installation instructions pattern

```markdown
## Installation

### Using pip
```bash
pip install package-name
```

### Using bun
```bash
bun install package-name
```

### From source
```bash
git clone <repo-url>
cd <repo>
<install command>
```
```

### Troubleshooting pattern

```markdown
## Troubleshooting

### Error: "Problem summary"
**Cause:** Why this happens

**Solution:**
```bash
<fix command>
```
```

## Example Output

**User Request:** "Write a README for a CLI tool that sorts files by size"

**Response:**

```markdown
# filesort

Sort and organize files by size from the command line.

## Features

- Sort files in any directory by size
- Filter by file extension
- Export results to CSV
- Human-readable size formatting

## Installation

```bash
pip install filesort
```

## Quick Start

Sort files in current directory:
```bash
filesort .
```

Output:
```
1.2 GB    video.mp4
856 MB    dataset.zip
45 MB     photo.jpg
2.1 KB    README.md
```

## Usage

```bash
filesort [OPTIONS] DIRECTORY
```

### Options

| Option | Description |
|--------|-------------|
| `-r, --reverse` | Show largest files first (default: smallest first) |
| `-n, --number NUM` | Show only top N files |
| `-e, --extension EXT` | Filter by file extension |
| `-o, --output FILE` | Export to CSV file |
| `--recursive` | Include subdirectories |

### Examples

**Find your 10 largest files:**
```bash
filesort . --reverse --number 10
```

**Find large video files:**
```bash
filesort ~/Videos --extension mp4 --reverse
```

**Export file list to CSV:**
```bash
filesort . --output files.csv
```

**Search recursively:**
```bash
filesort ~/Documents --recursive --reverse --number 20
```

## Configuration

Create `~/.filesort.yaml` for default options:

```yaml
reverse: true
number: 50
ignore:
  - "*.tmp"
  - "__pycache__"
```

## Troubleshooting

### "Permission denied" errors
Some directories require elevated permissions:
```bash
sudo filesort /var/log
```

### No files shown
Check if you're filtering too aggressively:
```bash
# This might not match anything
filesort . --extension xyz

# Try without filters
filesort .
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
```

---

**Why this works:**
- Starts with clear value proposition
- Quick start gets users running immediately
- Examples for every feature
- Troubleshooting for common issues
- Scannable structure with tables
- Progressive complexity (basic → advanced)

Keep example output concise and realistic. Prefer representative excerpts over
very long full-document dumps.
