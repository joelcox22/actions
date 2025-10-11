// This is a wrapper file that allows us to use github
// composite actions with deno instead of node.

import { spawnSync } from "node:child_process";
import { join } from 'node:path';

spawnSync(join(__dirname, 'semantic-release.ts'), {
  stdio: 'inherit',
});
