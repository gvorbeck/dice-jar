# dice-jar

Tabletop RPG character apps, one per game, sharing their tooling and, once a second app needs it, their code. Package scope: `@dice-jar/*`.

No apps are in yet. The plan and the conventions every app follows are in [docs/brief.md](docs/brief.md); the rules for changing anything are in [AGENTS.md](AGENTS.md).

| App         | Game              | Rules MCP server    | Access    |
| ----------- | ----------------- | ------------------- | --------- |
| codename    | Delta Green       | `rules-delta-green` | link-only |
| hearthfire  | Stonetop          | `rules-stonetop`    | link-only |
| codex-quest | Basic Fantasy RPG | `rules-bfrpg`       | accounts  |
| glyph-quest | Knave             | `rules-knave`       | accounts  |

None of these rules servers exist yet. Today there is one, `ttrpg-rules` (Delta Green only); it is split into one server per game before hearthfire comes in (see "Rules MCP" in the brief). Until then, codename uses `ttrpg-rules`.

## Layout

```
apps/<app>/          one app each: its own firebase.json, .firebaserc, firestore.rules, functions/, e2e/, test/
packages/<name>/     shared code, created only when a second app needs it
scripts/             workspaces.js: runs a script in every workspace that has it
.github/             checks workflow, dependabot.yml
.husky/              git hooks
```

## Running locally

Use Node 24 (`.nvmrc`; `engine-strict` refuses anything else).

```bash
npm ci
```

```bash
npm run check
```

`npm ci` also installs the git hooks. One app's script: `npm run dev -w apps/<app>`.

| Root script                                                                     |                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                 | `prettier --check .`, `eslint .`, `knip`, then `typecheck` and `test:coverage` in every workspace |
| `npm run format`                                                                | Prettier, writing                                                                                 |
| `npm run lint` / `knip`                                                         | ESLint / unused files, exports and dependencies, whole repo                                       |
| `npm run build`, `test`, `typecheck`, `test:coverage`, `test:rules`, `test:e2e` | That script in every workspace that has it. `test:rules` and `test:e2e` need Java 21              |

Every workspace uses the same script names: `dev`, `build`, `test`, `lint`, `typecheck`, `knip`, `test:coverage`, `test:rules`, `test:e2e`, `check`.

## Working on a change

`main` is production and deploys. `dev` is where work lands first and never deploys. Nothing reaches `main` except through a PR from `dev`.

1. **Start from `dev`.** `git switch dev && git pull`. For anything bigger than a small fix, cut a branch: `git switch -c <name>`.
2. **Work.** Run `npm run check` as you go, plus `npm run test:rules` and `npm run test:e2e` when [AGENTS.md](AGENTS.md) says to.
3. **Commit and push the branch.** The hooks check formatting and lint on commit, and run the full `npm run check` on push. They can't be skipped, and they refuse `main`.
4. **PR into `dev`.** It's the default base. The `checks` job runs; merge when it's green. Dependabot's PRs go through the same step. Nothing is live yet.
5. **Release.** Open a PR with base `main` and compare `dev`. Merge it with **Create a merge commit**, not squash, or `main` and `dev` drift apart and the next release shows the same changes again. The merge deploys: rules first, then Functions, then Hosting.

Adding or removing a Firestore field takes two releases, because open tabs keep running the old build. Release 1 allows the field in `firestore.rules`; release 2 starts using it. For example, adding avatars to a character sheet: one PR that allows `avatarUrl` in the rules, released; then a later PR where the app writes it.

## Hooks

- `pre-commit`: Prettier (`--check`) and ESLint on staged files. A commit with unformatted or lint-failing code is refused; run `npm run format` and commit again.
- `pre-push`: `npm run check`.
- Once `main` is on GitHub, both hooks also refuse a commit on `main` and a push to it. Work on `dev` (or another branch) and open a PR into `main`. The first push of `main` is allowed. Branch protection on GitHub enforces the same rule for everyone.

## CI

[`.github/workflows/checks.yml`](.github/workflows/checks.yml) runs one `checks` job on every PR to `dev` or `main` and every push to `dev` and `main`: `npm ci`, `npm ci` in each app's `functions/`, `npm run check`, then `test:rules` and `test:e2e`. Work goes to `dev`; `main` deploys. Each app brings its own deploy workflow.

Dependabot targets `dev`: npm weekly (minor and patch grouped, each major alone), GitHub Actions monthly. Greptile reviews PRs against [AGENTS.md](AGENTS.md) (`greptile.json`).

## Branch protection

Set in GitHub → Settings → Branches (or Rules → Rulesets), once for `dev` and once for `main`:

| Setting                                                 | `dev` | `main` |
| ------------------------------------------------------- | ----- | ------ |
| Require a pull request before merging                   | no    | yes    |
| Require status checks to pass, required check: `checks` | yes   | yes    |
| Require branches to be up to date before merging        | no    | no     |
| Allow force pushes                                      | no    | no     |
| Allow deletions                                         | no    | no     |
| Do not allow bypassing the above settings               | no    | yes    |

A required check blocks direct pushes, because a new commit hasn't passed it yet. So admins may bypass on `dev` to push work there; Dependabot's PRs to `dev` still need `checks`. `main` takes changes only through a PR from `dev`, where `checks` runs on the PR as well. Neither branch requires being up to date, so Dependabot's weekly PRs don't each need an update and a new CI run after another one merges. On `main` it would also block every next release, because each merge adds a commit `dev` lacks, until `main` is merged back.

## GitHub settings

The repo is public. In Settings:

- **General → Pull Requests:** turn on "Automatically delete head branches".
- **Advanced Security:** turn on Dependabot alerts, Dependabot security updates, secret scanning with push protection, and CodeQL (default setup, JavaScript/TypeScript: scans pushes and PRs on `dev` and `main`, and weekly).
- **Rules → Rulesets:** one ruleset per branch, as in "Branch protection" above. Both are saved in [.github/rulesets/](.github/rulesets/) and can be imported (New ruleset → Import a ruleset). If you change a ruleset in GitHub, update its file. On `main`, set the pull request rule's allowed merge methods to **merge commit only**, so a release can't be squashed by mistake.
- **Greptile:** install the GitHub app on this repo only, at greptile.com. `greptile.json` is its config, and it reads [AGENTS.md](AGENTS.md).
