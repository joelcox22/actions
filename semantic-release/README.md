# Semantic Release Action

A GitHub composite action that runs semantic-release with minimal configuration required from the calling repository.

### Basic Usage

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
