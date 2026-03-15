# Contributing Guide

Welcome! This document walks you through the standard workflow for contributing code to this repository. Please read it before making your first contribution.

---

## Prerequisites

| Tool | Installation |
|------|-------------|
| **Git** | [git-scm.com/downloads](https://git-scm.com/downloads) |
| **GitHub CLI** (optional but recommended) | [cli.github.com](https://cli.github.com/) |
| **GitHub account** | [github.com/signup](https://github.com/signup) |

Make sure Git is configured with your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## One-Time Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<org>/AI-Powered-Micro-Wellness-Productivity-Assistant-for-Women-Employees.git
cd AI-Powered-Micro-Wellness-Productivity-Assistant-for-Women-Employees
```

### 2. Verify the Remote

```bash
git remote -v
```

You should see `origin` pointing to the GitHub URL.

---

## Daily Development Workflow

### Step 1 — Sync Your Local `main`

Always start from an up-to-date `main` branch:

```bash
git checkout main
git pull origin main
```

### Step 2 — Create a Feature Branch

Create a new branch for every piece of work. Use a descriptive name:

```bash
git checkout -b <type>/<short-description>
```

**Branch naming conventions:**

| Prefix | Use for |
|--------|---------|
| `feature/` | New features (e.g., `feature/add-wellness-dashboard`) |
| `fix/` | Bug fixes (e.g., `fix/login-crash`) |
| `docs/` | Documentation changes (e.g., `docs/update-readme`) |
| `refactor/` | Code restructuring (e.g., `refactor/api-layer`) |
| `test/` | Adding or updating tests (e.g., `test/auth-module`) |

### Step 3 — Make Your Changes

Edit, add, or delete files as needed. Check the status of your changes at any time:

```bash
git status        # see which files changed
git diff          # see the actual changes
```

### Step 4 — Stage Your Changes

```bash
git add .                        # stage all changes
# or
git add path/to/specific/file   # stage individual files
```

> **Tip:** Avoid staging files that contain secrets (API keys, passwords, `.env` files). Add them to `.gitignore` instead.

### Step 5 — Commit Your Changes

Write a clear, concise commit message that explains **what** and **why**:

```bash
git commit -m "Add wellness score calculation for daily check-ins"
```

**Good commit messages:**
- `Add user authentication with JWT tokens`
- `Fix crash when submitting empty wellness form`
- `Refactor database queries for better performance`

**Bad commit messages:**
- `fix stuff`
- `updated files`
- `asdfgh`

You can make multiple small commits on your branch — that's perfectly fine.

### Step 6 — Pull Latest Changes and Rebase

Before pushing, make sure your branch is up to date with `main` to avoid conflicts:

```bash
git pull origin main --rebase
```

#### If You Get Merge Conflicts

Git will pause and mark conflicting files. Open each one and look for conflict markers:

```
<<<<<<< HEAD
your changes
=======
changes from main
>>>>>>> main
```

Resolve the conflict by keeping the correct code, then:

```bash
git add .
git rebase --continue
```

If things go wrong and you want to abort the rebase:

```bash
git rebase --abort
```

### Step 7 — Push Your Branch to GitHub

```bash
git push -u origin <your-branch-name>
```

Example:

```bash
git push -u origin feature/add-wellness-dashboard
```

### Step 8 — Open a Pull Request (PR)

**Option A — GitHub website:**

1. Go to the repository on GitHub.
2. You'll see a banner suggesting to create a PR for your recently pushed branch — click it.
3. Fill in the PR title and description.

**Option B — GitHub CLI:**

```bash
gh pr create --title "Add wellness dashboard" --body "Implements the daily wellness score dashboard with charts and summary view."
```

**In your PR description, include:**
- A brief summary of what you changed and why
- Steps to test (if applicable)
- Reference to related issues (e.g., `Closes #12`)
- Screenshots (for UI changes)

### Step 9 — Code Review

- Request reviews from teammates.
- Respond to feedback by making changes on the **same branch**, committing, and pushing again:

```bash
git add .
git commit -m "Address review: add input validation"
git push
```

- The PR updates automatically.

### Step 10 — Merge

Once approved, merge the PR via the GitHub UI. Prefer **"Squash and merge"** for a clean history unless your team decides otherwise.

### Step 11 — Clean Up

After merging, delete your feature branch and sync:

```bash
git checkout main
git pull origin main
git branch -d <your-branch-name>
```

---

## Quick Reference Cheat Sheet

```bash
# Start fresh
git checkout main
git pull origin main

# Create branch
git checkout -b feature/my-feature

# Work and commit
git add .
git commit -m "Describe your change"

# Sync and push
git pull origin main --rebase
git push -u origin feature/my-feature

# Open PR on GitHub, get reviewed, merge, clean up
git checkout main
git pull origin main
git branch -d feature/my-feature
```

---

## Rules to Follow

1. **Never push directly to `main`.** Always use a feature branch and a Pull Request.
2. **Keep branches small and focused.** One branch = one logical change. Easier to review, fewer conflicts.
3. **Pull/rebase frequently.** Don't let your branch drift far from `main`.
4. **Write meaningful commit messages.** Your teammates (and future you) will thank you.
5. **Don't commit secrets.** No API keys, passwords, tokens, or `.env` files. Use `.gitignore`.
6. **Test before pushing.** Make sure your changes work locally before opening a PR.
7. **Review others' PRs.** Code review is a two-way street — give thoughtful feedback.

---

## Common Issues and Fixes

| Problem | Solution |
|---------|----------|
| `fatal: not a git repository` | Run `cd` into the project folder first |
| `error: failed to push some refs` | Run `git pull origin main --rebase` then push again |
| `CONFLICT` during rebase | Open conflicting files, resolve markers, `git add .`, `git rebase --continue` |
| Accidentally committed to `main` | `git reset HEAD~1` to undo, then create a branch and recommit |
| Need to undo last commit (not pushed) | `git reset --soft HEAD~1` (keeps changes staged) |
| Want to discard all local changes | `git checkout -- .` (cannot be undone) |

---

## Need Help?

- **Git documentation:** [git-scm.com/doc](https://git-scm.com/doc)
- **GitHub Docs:** [docs.github.com](https://docs.github.com/)
- Ask a teammate — no question is too small!
