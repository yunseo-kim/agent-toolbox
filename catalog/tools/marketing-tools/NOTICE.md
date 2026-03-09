# Attribution Notice

This tool bundle contains shared CLI scripts and integration documentation
derived from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills),
originally released under the
[MIT License](https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE).

These files are canonical copies shared across multiple catalog skills
(ad-creative, ai-seo, analytics-tracking, email-sequence, paid-ads, referral-program).
Individual skills reference these files via symlinks.

Content snapshot aligned to `coreyhaines31/marketingskills` commit
`2f5db8d95cff07fcc67d6f2be7fb0a677bf897e6`.

## Modifications

- Added `redactSensitive()` function to all CLI scripts to prevent clear-text
  logging of sensitive information (API keys, tokens, secrets)
- CLI scripts adapted from upstream `tools/clis/` directory
- Integration docs adapted from upstream `tools/integrations/` directory

## Upstream License

MIT License

Copyright (c) 2025 Corey Haines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

For the full upstream license text, see:
https://github.com/coreyhaines31/marketingskills/blob/main/LICENSE
