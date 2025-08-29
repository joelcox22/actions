# Semantic Release Action

A GitHub composite action that runs semantic-release with minimal configuration required from the calling repository.

## Features

- **Zero Configuration**: No need for `.releaserc.js`, `package.json`, or any semantic-release configuration files in your repository
- **Smart Branching**: 
  - `main` branch: Creates full releases (e.g., `v1.2.3`)
  - Other branches: Creates prereleases (e.g., `v1.2.3-feature.1`)
- **Tags Only**: Only pushes git tags, no commits back to the repository
- **Dry Run Support**: Test releases without actually publishing
- **Environment Variables**: Exposes release version for use in subsequent workflow steps

## Usage

### Basic Usage

```yaml
name: Release
on:
  push:
    branches: [main, develop, feature/*]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Release
        uses: your-org/actions/semantic-release@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### With Dry Run

```yaml
      - name: Release (Dry Run)
        uses: your-org/actions/semantic-release@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          dry-run: 'true'
```

### Using Release Version in Subsequent Steps

```yaml
      - name: Release
        id: release
        uses: your-org/actions/semantic-release@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Use release version
        if: steps.release.outputs.new-release-published == 'true'
        run: |
          echo "New version: ${{ steps.release.outputs.new-release-version }}"
          echo "New tag: ${{ steps.release.outputs.new-release-git-tag }}"
          echo "Environment variable: $NEW_RELEASE_VERSION"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for authentication | Yes | `${{ github.token }}` |
| `dry-run` | Run in dry-run mode (no actual release) | No | `false` |
| `working-directory` | Working directory to run semantic-release from | No | `.` |

## Outputs

| Output | Description |
|--------|-------------|
| `new-release-version` | The new release version number (without v prefix) |
| `new-release-git-tag` | The new release git tag (with v prefix) |
| `new-release-published` | Whether a new release was published (`true`/`false`) |

## Environment Variables Set

The action sets the following environment variables for use in subsequent steps:

- `NEW_RELEASE_VERSION`: The new release version (without v prefix)
- `NEW_RELEASE_GIT_TAG`: The new release git tag (with v prefix)

## Commit Message Format

This action uses [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (major version bump)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` - No version bump

### Examples

```
feat: add new user authentication
fix: resolve memory leak in cache
feat!: remove deprecated API endpoints
docs: update installation guide
```

## Permissions Required

The workflow using this action needs the following permissions:

```yaml
permissions:
  contents: write    # To create releases and tags
  issues: write      # To comment on issues
  pull-requests: write # To comment on PRs
```

## Branch Strategy

- **main**: Creates full releases (1.0.0, 1.1.0, etc.)
- **develop/feature/hotfix/etc.**: Creates prereleases (1.1.0-develop.1, 1.1.0-feature-auth.2, etc.)

## What Gets Created

- **Git Tag**: Always created (e.g., `v1.2.3`)
- **GitHub Release**: Created with auto-generated release notes
- **Changelog**: Not committed back to repository (tags only approach)

## Troubleshooting

### No Release Created

- Ensure your commit messages follow the conventional commit format
- Check that there are commits since the last release
- Verify the GitHub token has sufficient permissions

### Permission Denied

Make sure your workflow has the required permissions (see above) and that the GitHub token is valid.
