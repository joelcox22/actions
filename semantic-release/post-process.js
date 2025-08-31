#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Post-processing bundled file to fix import.meta and createRequire issues...');

const bundlePath = path.join(__dirname, 'dist', 'index.cjs');
let content = fs.readFileSync(bundlePath, 'utf8');

// Read semantic-release package.json to inline it
const semanticReleasePackageJson = JSON.stringify(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules/semantic-release/package.json'), 'utf8'))
);

// Add import.meta polyfill at the top
const polyfill = `// Import.meta polyfill for CommonJS
var __import_meta_url = require('url').pathToFileURL(__filename).href;
var __createRequire = require('module').createRequire;
var __filename_polyfill = __filename;

// Plugin registry for bundled plugins
var __bundled_plugins = {};

// Override module resolution for bundled packages
const originalRequire = require;
require = function(id) {
  if ((id === 'conventional-changelog-conventionalcommits' || id === 'conventional-changelog-angular') && global.__bundled_plugins && global.__bundled_plugins[id]) {
    return global.__bundled_plugins[id];
  }
  return originalRequire.apply(this, arguments);
};

`;

// Fix all import_meta variables that are being set to empty objects
content = content.replace(/import_meta\d*\s*=\s*{};?/g, '');

// Fix all import_meta.url references with numbered versions
content = content.replace(/import_meta\d*\.url/g, "__import_meta_url");

// Fix createRequire calls that use import_meta.url
content = content.replace(
  /createRequire\(\s*import_meta\d*\.url\s*\)/g,
  "__createRequire(__filename_polyfill)"
);

// Fix any other createRequire calls with undefined values
content = content.replace(
  /createRequire\(\s*undefined\s*\)/g,
  "__createRequire(__filename_polyfill)"
);

// Fix any remaining createRequire calls with empty url
content = content.replace(
  /createRequire\(\s*\{\s*\}\.url\s*\)/g,
  "__createRequire(__filename_polyfill)"
);

// Replace dynamic package.json requires with the actual content
content = content.replace(
  /require\d*\("\.\.\/\.\.\/package\.json"\)/g,
  semanticReleasePackageJson
);

// Also handle other common package.json require patterns
content = content.replace(
  /require\d*\("\.\/package\.json"\)/g,
  semanticReleasePackageJson
);

content = content.replace(
  /require\d*\("package\.json"\)/g,
  semanticReleasePackageJson
);

// Replace the loadPlugin function to use bundled plugins instead of dynamic imports
const loadPluginReplacement = `async function loadPlugin({ cwd }, name, pluginsPath) {
  const basePath = pluginsPath[name] ? (0, import_node_path14.dirname)(import_resolve_from.default.silent(__dirname2, pluginsPath[name]) || (0, import_resolve_from.default)(cwd, pluginsPath[name])) : __dirname2;
  if (isFunction_default(name)) {
    return name;
  }
  
  // Use bundled plugins instead of dynamic imports
  if (global.__bundled_plugins && global.__bundled_plugins[name]) {
    return global.__bundled_plugins[name];
  }
  
  // Special handling for conventional changelog presets
  if (name === 'conventional-changelog-conventionalcommits' || name === 'conventionalcommits') {
    if (global.__bundled_plugins && global.__bundled_plugins['conventional-changelog-conventionalcommits']) {
      return global.__bundled_plugins['conventional-changelog-conventionalcommits'];
    }
  }
  
  if (name === 'conventional-changelog-angular' || name === 'angular') {
    if (global.__bundled_plugins && global.__bundled_plugins['conventional-changelog-angular']) {
      return global.__bundled_plugins['conventional-changelog-angular'];
    }
  }
  
  // Fallback to original logic for non-bundled plugins
  const file = import_resolve_from.default.silent(basePath, name) || (0, import_resolve_from.default)(cwd, name);
  const { default: cjsExport, ...esmNamedExports } = await import(\`file://\${file}\`);
  if (cjsExport) {
    return cjsExport;`;

// Find and replace the loadPlugin function
content = content.replace(
  /async function loadPlugin\(\{ cwd \}, name, pluginsPath\) \{[\s\S]*?if \(cjsExport\) \{[\s\S]*?return cjsExport;/,
  loadPluginReplacement
);

// Add the polyfill at the beginning
content = polyfill + content;

fs.writeFileSync(bundlePath, content);
console.log('✅ Post-processing complete! Fixed all import.meta, createRequire, package.json, and plugin loading issues.');
