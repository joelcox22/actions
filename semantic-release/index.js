
const core = require('@actions/core');
const github = require('@actions/github');
const semanticRelease = require('semantic-release').default || require('semantic-release');

// Force bundling of semantic-release plugins by requiring them
// This ensures they're available when semantic-release tries to load them dynamically
require('@semantic-release/commit-analyzer');
require('@semantic-release/release-notes-generator');
require('@semantic-release/changelog');
require('@semantic-release/github');
require('@semantic-release/git');
require('conventional-changelog-conventionalcommits');

async function run() {
  try {
    const dryRun = core.getInput('dry-run') === 'true';
    const workingDirectory = core.getInput('working-directory') || '.';
    process.chdir(workingDirectory);

    // Determine branch config
    const branchName = github.context.ref.replace('refs/heads/', '');
    let prerelease = branchName !== 'main';
    let branchConfig = prerelease ? branchName : 'main';

    // Prepare config for semantic-release
    const config = {
      branches: [
        'main',
        { name: '*', prerelease: true }
      ],
      plugins: [
        [ '@semantic-release/commit-analyzer', { preset: 'conventionalcommits' } ],
        [ '@semantic-release/release-notes-generator', { preset: 'conventionalcommits' } ],
        [ '@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' } ],
        [ '@semantic-release/github', { assets: [] } ]
      ],
      repositoryUrl: `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}`,
      tagFormat: 'v${version}'
    };

    // Set up environment variables
    process.env.GITHUB_TOKEN = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    process.env.GIT_AUTHOR_NAME = 'github-actions[bot]';
    process.env.GIT_AUTHOR_EMAIL = '41898282+github-actions[bot]@users.noreply.github.com';
    process.env.GIT_COMMITTER_NAME = 'github-actions[bot]';
    process.env.GIT_COMMITTER_EMAIL = '41898282+github-actions[bot]@users.noreply.github.com';

    // Run semantic-release
    const result = await semanticRelease({
      dryRun,
      ...config
    });

    let published = false;
    let version = '';
    let tag = '';
    if (result && result.releases && result.releases.length > 0) {
      published = true;
      version = result.lastRelease.version;
      tag = result.lastRelease.gitTag;
    }
    core.setOutput('new-release-published', published ? 'true' : 'false');
    core.setOutput('new-release-version', version || '');
    core.setOutput('new-release-git-tag', tag || '');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
