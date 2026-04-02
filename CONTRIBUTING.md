# Contributing

Contributions are welcome. If you have an idea or have found a bug, please raise an issue before starting work on large changes.

When raising a bug, please fill out the issue template including what you did, what you expected to happen, and what happened instead.

## Branching

This project follows [Gitflow](https://defra.github.io/software-development-standards/guides/developer_workflows/#gitflow). Create feature branches from `develop` using kebab-case names, e.g. `feature/add-search-page`.

Branch protection is enforced through repository rulesets. All changes to `develop`, `release/*` and `main` must go through a pull request with all status checks passing. Pull requests for new features should target `develop`. A GitHub Action is included in the repository to check that PR targets match Gitflow workflow rules.

## Commit messages

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Commit messages must be structured as:

```
<type>(<optional scope>): <description>
```

Common types: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `refactor`, `test`.

## Code style

Code style and formatting are enforced by [neostandard](https://github.com/neostandard/neostandard) via ESLint — no semicolons, single quotes, no trailing commas. SCSS is linted by [StyleLint](https://stylelint.io/) with the GDS config.

```bash
npm run lint          # Check for issues (read-only)
npm run format        # Auto-fix issues
```

## Submitting a pull request

A pre-commit hook runs the security audit, linter and tests automatically before each commit via [Husky](https://typicode.github.io/husky/).

- Give your PR a meaningful title and description

## Standards

This project follows:

- [Defra Software Development Standards](https://defra.github.io/software-development-standards/)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GDS Service Manual](https://www.gov.uk/service-manual)
