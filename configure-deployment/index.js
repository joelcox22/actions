// This is a wrapper file that allows us to use github
// composite actions with deno instead of node.

import { spawnSync } from "node:child_process";
import { join } from 'node:path';

spawnSync(join(import.meta.dirname, 'configure-deployment.ts'), {
  stdio: 'inherit',
  env: Deno.env.toObject(),
});
