#!/usr/bin/env -S deno run --allow-all

import { join } from '@std/path';
import * as yaml from '@std/yaml';

const cluster = 'linode';
const project = Deno.env.get('GITHUB_REPOSITORY')!;
const id = Deno.env.get('GITHUB_REF')!.replace('refs/heads/', '').replace(/\//g, '-');

const dir = join('gitops-repo', 'apps', cluster, project, id);
const configFile = join(dir, 'app.yml');

await Deno.mkdir(dir, { recursive: true });

let config: Record<string, unknown> = {};

try {
    const currentConfigText = await Deno.readTextFile(configFile);
    config = yaml.parse(currentConfigText) as Record<string, unknown>;
} catch (_err) {
    console.log('No existing config file');
}

config.image = `ghcr.io/${Deno.env.get('GITHUB_REPOSITORY')}:${Deno.env.get('GITHUB_SHA')}`;

Deno.writeTextFile(join(dir, 'app.yml'), yaml.stringify(config));
