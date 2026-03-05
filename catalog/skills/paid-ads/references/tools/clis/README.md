# Marketing CLIs

Zero-dependency, single-file CLI tools for marketing platforms that don't ship their own.

Every CLI is a standalone Node.js script (Node 18+) with no `npm install` required - just `chmod +x` and go.

## Install

### Option 1: Run directly

```bash
node tools/clis/ahrefs.js backlinks list --target example.com
```

### Option 2: Symlink for global access

```bash
# Symlink any CLI you want available globally
ln -sf "$(pwd)/tools/clis/ahrefs.js" ~/.local/bin/ahrefs
ln -sf "$(pwd)/tools/clis/resend.js" ~/.local/bin/resend

# Then use directly
ahrefs backlinks list --target example.com
resend send --from you@example.com --to them@example.com --subject "Hello" --html "<p>Hi</p>"
```

### Option 3: Add the whole directory to PATH

```bash
export PATH="$PATH:/path/to/marketingskills/tools/clis"
```

## Authentication

Every CLI reads credentials from environment variables.

## Security

Never hardcode API keys or tokens in scripts. All CLIs read credentials exclusively from environment variables.

- Store keys in your shell profile (`~/.zshrc`, `~/.bashrc`) or a `.env` file
- Use `--dry-run` on any command to preview requests

## Command Pattern

All CLIs follow the same structure:

```text
{tool} <resource> <action> [options]
```

## Output

All CLIs output JSON to stdout for piping and automation.
