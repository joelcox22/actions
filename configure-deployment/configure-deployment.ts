#!/usr/bin/env -S deno run --allow-all

import { join } from '@std/path';
import * as yaml from '@std/yaml';

const [owner, repoName] = Deno.env.get('GITHUB_REPOSITORY')!.split('/');

const blueprint = 'app'; // fixme
const cluster = 'linode';
const project = repoName;
const branch = Deno.env.get('GITHUB_REF')!.replace('refs/heads/', '').replace(/\//g, '-');


const dir = join('gitops-repo', 'blueprints', blueprint, 'deployments', cluster, project, branch);
const configFile = join(dir, 'app.yaml');

console.log({ owner, repoName, blueprint, cluster, project, branch, dir, configFile });

await Deno.mkdir(dir, { recursive: true });

let config: Record<string, unknown> = {};

try {
    const currentConfigText = await Deno.readTextFile(configFile);
    config = yaml.parse(currentConfigText) as Record<string, unknown>;
    console.log('loaded existing config', config);
} catch (_err) {
    console.log('No existing config file');
}

config.image = `ghcr.io/${owner}/${repoName}/app:${Deno.env.get('NEW_RELEASE_VERSION')}`;

console.log('writing updated config', config);

Deno.writeTextFile(join(dir, 'values.yaml'), yaml.stringify(config));
