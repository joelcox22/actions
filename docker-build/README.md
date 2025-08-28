# Docker Build & Publish Composite Action

This composite GitHub Action builds a Docker image from your repository and publishes it to the GitHub Container Registry (ghcr.io) using the current commit hash as the image tag.

## Usage

Add the following to your workflow YAML:

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Docker Image
        uses: <your-org-or-username>/actions/docker-build@main
        with:
          image_name: my-app
```

### Inputs
- `image_name`: (required) The name of the image to build and push.

### How it works
1. Builds the Docker image using the Dockerfile in your repo.
2. Tags the image as `ghcr.io/<repo_owner>/<repo_name>/<image_name>:<commit_sha>`.
3. Publishes the image to GitHub Container Registry.

### Requirements
- The workflow must have `GITHUB_TOKEN` with `write:packages` permission (default for private actions).

### Example
```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Docker Image
        uses: <your-org-or-username>/actions/docker-build@main
        with:
          image_name: my-app
```
