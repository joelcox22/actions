# Semantic Release Action

GitHub Action that runs semantic-release with minimal configuration required from the calling repository.

It first runs in dry-run mode when the action is called, which creates action outputs with the planned new version information.
Then the rest of your actions workflow runs, and if successful, the **__actual__** semantic-release run is executed in
the post hook, which publishes version tags and artifacts.

This setup works nicely, because your build steps can bundle in the planned version number easily, but
if a build step fails, the release won't actually get published.

## Basic Usage

```yaml
name: Release
on: push

permissions:
  contents: write
  issues: write
  pull-requests: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: joelcox22/actions/init@main
      - uses: joelcox22/actions/semantic-release@main
      - uses: joelcox22/actions/docker-build@main
```
