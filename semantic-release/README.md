# Semantic Release Action


This is a JavaScript GitHub Action that runs semantic-release with minimal configuration required from the calling repository. All dependencies are bundled so no npm install is needed at runtime.

## Building the Action

Before committing changes, bundle the action and its dependencies using [esbuild](https://esbuild.github.io/):

```bash
npm run build
```

This will generate a `dist` directory containing the bundled code. Commit the contents of `dist` to your repository so users do not need to run `npm install`.

## Development Setup

1. Make changes to `index.js` or dependencies in `package.json`.
2. Run `npm run build` to update the bundle.
3. Commit both your source changes and the updated `dist` directory.

## Usage


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
