
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

// Register bundled plugins globally so the loadPlugin function can find them
global.__bundled_plugins = {
  '@semantic-release/commit-analyzer': commitAnalyzer,
  '@semantic-release/release-notes-generator': releaseNotesGenerator,
  '@semantic-release/changelog': changelog,
  '@semantic-release/github': githubPlugin,
  '@semantic-release/git': gitPlugin
};

async function run() {
  try {
    // Check if we're running in the post hook
    // GitHub Actions sets STATE_isPost=true for post hooks
    const isPostHook = process.env.STATE_isPost === 'true';
    
    // If this is the post hook, check if we should proceed
    if (isPostHook) {
      // Post hooks in GitHub Actions only run if the job is completing
      // If any step failed with default settings, the job would have stopped
      // However, we can add an explicit check using job.status context if needed
      
      // Check if the dry-run determined a release should be created
      const shouldRelease = process.env.STATE_shouldRelease === 'true';
      if (!shouldRelease) {
        console.log('ℹ️  Skipping release - dry-run analysis determined no release is needed');
        return;
      }
      
      console.log('✅ All previous steps succeeded, proceeding with release...');
    }
    
    // Main action always runs dry-run, post hook runs the actual release
    const dryRun = !isPostHook;
    
    // Save state for post hook if this is the main action
    if (!isPostHook) {
      core.saveState('isPost', 'true');
    }
    
    console.log(isPostHook ? '🚀 Running semantic-release post hook (actual release)...' : '🔍 Running semantic-release main action (dry-run analysis)...');
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
        '@semantic-release/commit-analyzer',  // Use with absolutely no configuration
        '@semantic-release/release-notes-generator',  // Temporarily disable to isolate template issue
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
    
    if (result && result.nextRelease) {
      // New release was created (or will be created in dry-run)
      published = !dryRun; // Only mark as published if this is the actual release
      version = result.nextRelease.version;
      tag = result.nextRelease.gitTag;
      
      if (dryRun) {
        console.log(`✅ Dry-run analysis complete: Will create release ${tag}`);
      } else {
        console.log(`✅ Successfully created release ${tag}`);
      }
    } else if (result && result.lastRelease) {
      // No new release, but we have info about the last release
      version = result.lastRelease.version;
      tag = result.lastRelease.gitTag;
      
      if (dryRun) {
        console.log('ℹ️  Dry-run analysis complete: No release needed');
      }
    } else {
      if (dryRun) {
        console.log('ℹ️  Dry-run analysis complete: No release needed');
      }
    }
    
    core.setOutput('new-release-published', published ? 'true' : 'false');
    core.setOutput('new-release-version', version || '');
    core.setOutput('new-release-git-tag', tag || '');
    
    // Set will-release output (true if dry-run found a release to create)
    const willRelease = dryRun && result && result.nextRelease;
    core.setOutput('will-release', willRelease ? 'true' : 'false');
    
    // Save state for post hook about whether to create a release
    if (!isPostHook) {
      core.saveState('shouldRelease', willRelease ? 'true' : 'false');
    }
    
    // Also set as environment variable for downstream actions
    if (version) {
      core.exportVariable('NEW_RELEASE_VERSION', version);
      if (tag) {
        core.exportVariable('NEW_RELEASE_GIT_TAG', tag);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
