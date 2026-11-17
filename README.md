# dice-jar

Tabletop RPG character apps, one per game, sharing their tooling and, once a second app needs it, their code. Package scope: `@dice-jar/*`.

delta-green and stonetop are in so far (stonetop is the app behind hearthfire.camp). The plan and the conventions every app follows are in [docs/brief.md](docs/brief.md); the rules for changing anything are in [AGENTS.md](AGENTS.md).

| App         | Game              | Rules MCP server    | Access    |
| ----------- | ----------------- | ------------------- | --------- |
| delta-green | Delta Green       | `delta-green-rules` | link-only |
| stonetop    | Stonetop          | `stonetop-rules`    | link-only |
| codex-quest | Basic Fantasy RPG | `bfrpg-rules`       | accounts  |
| glyph-quest | Knave             | `knave-rules`       | accounts  |

Rules servers are named `<game>-rules`. `delta-green-rules` and `stonetop-rules` are connected; the other two are not yet.

## Licensing

The code here is MIT ([LICENSE](LICENSE)): the tooling, everything in `packages/`, and app code. Use it, fork it, learn from it.

Game content is different. The rules text, game data, art, names and trademarks in an app belong to the game's publisher, and an app may need its own terms to match the license its game is published under. So:

| What                                                 | Terms                                                | Where it's stated                |
| ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| Tooling, `packages/`, app code                       | MIT                                                  | the root `LICENSE`               |
| An app's game content (rules text, data, art, names) | the game's own license or the publisher's permission | `apps/<app>/LICENSE` or `NOTICE` |
| Book text                                            | never committed to this repo                         | the private rules server         |

Where an app has its own `LICENSE` or `NOTICE`, that file governs the app's directory. delta-green's Legal section in its README is the model: published by arrangement with the publisher, with the code's own copyright kept apart from the game's.

## Layout

```
apps/<app>/          one app each: its own firebase.json, .firebaserc, firestore.rules, functions/, e2e/, test/
packages/<name>/     shared code, created only when a second app needs it
scripts/             workspaces.js: runs a script in every workspace that has it
.github/             checks workflow, dependabot.yml, rulesets, CODEOWNERS, PR template
.husky/              git hooks
```

## Running locally

Use Node 24 (`.nvmrc`; `engine-strict` refuses anything else), on macOS, Linux or WSL. The hooks and `scripts/` assume `sh` and `npm` on the PATH, so native Windows isn't supported.

```bash
npm ci
```

```bash
npm run check
```

`npm ci` also installs the git hooks. One app's script: `npm run dev -w apps/<app>`. To start an app's dev server: `npm run dg` (delta-green) or `npm run st` (stonetop).

| Root script                                                                     |                                                                                                                                                    |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                 | `prettier --check .`, `eslint .` (warnings fail it too), `knip`, the tests for `scripts/`, then `typecheck` and `test:coverage` in every workspace |
| `npm run format`                                                                | Prettier, writing                                                                                                                                  |
| `npm run lint` / `knip`                                                         | ESLint / unused files, exports and dependencies, whole repo                                                                                        |
| `npm run build`, `test`, `typecheck`, `test:coverage`, `test:rules`, `test:e2e` | That script in every workspace that has it. `test:rules` and `test:e2e` need Java 21                                                               |

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

[`.github/workflows/checks.yml`](.github/workflows/checks.yml) runs one `checks` job on every PR to `dev` or `main` and every push to `dev` and `main`: `npm ci`, `npm ci` in each app's `functions/`, `npm run check`, `npm run build`, then `test:rules` and `test:e2e`. Work goes to `dev`; `main` deploys. Each app brings its own deploy workflow.

[`label-pr.yml`](.github/workflows/label-pr.yml) labels each PR with the name of every app it touches, so PRs can be filtered by app.

Dependabot targets `dev`: npm weekly (minor and patch grouped, each major alone), GitHub Actions monthly. Greptile reviews PRs against [AGENTS.md](AGENTS.md) (`greptile.json`).

## Branch protection

The rules are in [.github/rulesets/](.github/rulesets/), and the GitHub settings section below says how to import them. Both branches require `checks` and block force pushes and deletions. The differences, and why:

- `dev` has no pull request rule, and admins may bypass it, so you can push work there. A required check blocks direct pushes, because a new commit hasn't passed it yet, so the bypass is what allows them. Dependabot's PRs to `dev` still need `checks`.
- `main` takes changes only through a PR from `dev`, merged with a merge commit, and nobody can bypass it. `checks` runs on that PR too.
- Neither requires being up to date, so Dependabot's weekly PRs don't each need an update and a new CI run after another one merges. On `main` it would also block every next release, because each merge adds a commit `dev` lacks, until `main` is merged back.

## GitHub settings

The repo is public. In Settings:

- **General → Pull Requests:** turn on "Automatically delete head branches".
- **Advanced Security:** turn on Dependabot alerts, Dependabot security updates, secret scanning with push protection, and CodeQL (default setup, JavaScript/TypeScript: scans pushes and PRs on `dev` and `main`, and weekly).
- **Rules → Rulesets:** one ruleset per branch, as in "Branch protection" above. Both are saved in [.github/rulesets/](.github/rulesets/) and can be imported (New ruleset → Import a ruleset). If you change a ruleset in GitHub, update its file. On `main`, set the pull request rule's allowed merge methods to **merge commit only**, so a release can't be squashed by mistake.
- **Private vulnerability reporting:** turn it on in Advanced Security. [SECURITY.md](SECURITY.md) sends reporters there.
- **Actions → General → Fork pull request workflows:** require approval for all external contributors (already set).
- **Greptile:** install the GitHub app on this repo only, at greptile.com. `greptile.json` is its config, and it reads [AGENTS.md](AGENTS.md).
