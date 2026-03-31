Run a clean, conventional commit for the current working changes.

Steps:
1. Run `git status` to see what's changed
2. Run `git diff` (staged and unstaged) to review the actual changes
3. Run `git log --oneline -5` to match the existing commit message style
4. Draft a concise conventional commit message (feat/fix/chore/docs/style/refactor) that describes the *why*, not just the what
5. Stage all relevant files (avoid .env, secrets, or build artifacts)
6. Run the commit with the message
7. Confirm with `git status` that the working tree is clean

Rules:
- Never use `git add -A` blindly — check what's being staged
- Never skip hooks with --no-verify
- Always end the commit message with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- If there's nothing to commit, say so clearly
