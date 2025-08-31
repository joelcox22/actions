
const core = require('@actions/core');
const github = require('@actions/github');
const semanticRelease = require('semantic-release').default || require('semantic-release');

// Force bundling of semantic-release plugins by requiring them
// This ensures they're available when semantic-release tries to load them dynamically
const commitAnalyzer = require('@semantic-release/commit-analyzer');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');
const changelog = require('@semantic-release/changelog');
const githubPlugin = require('@semantic-release/github');
const gitPlugin = require('@semantic-release/git');
const conventionalChangelog = require('conventional-changelog-conventionalcommits');

// Register bundled plugins globally so the loadPlugin function can find them
global.__bundled_plugins = {
  '@semantic-release/commit-analyzer': commitAnalyzer,
  '@semantic-release/release-notes-generator': releaseNotesGenerator,
  '@semantic-release/changelog': changelog,
  '@semantic-release/github': githubPlugin,
  '@semantic-release/git': gitPlugin,
  'conventional-changelog-conventionalcommits': conventionalChangelog
};

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
        [ '@semantic-release/commit-analyzer', { 
          preset: 'angular',  // Use angular preset instead of conventionalcommits to avoid the module resolution issue
          releaseRules: [
            { type: 'feat', release: 'minor' },
            { type: 'fix', release: 'patch' },
            { type: 'perf', release: 'patch' },
            { type: 'docs', scope: 'README', release: 'patch' },
            { type: 'refactor', release: 'patch' },
            { type: 'style', release: 'patch' }
          ]
        } ],
        [ '@semantic-release/release-notes-generator', { 
          preset: 'angular'  // Use angular preset instead
        } ],
        [ '@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' } ],
        [ '@semantic-release/github', { assets: [] } ]
      ],
      repositoryUrl: `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}`,
      tagFormat: 'v${version}'
    };

    // Set up environment variables
    // Get GitHub token from input (defaults to github.token) or environment
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GitHub token is required but not available. Please ensure your workflow has proper permissions.');
    }
    process.env.GITHUB_TOKEN = githubToken;
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
