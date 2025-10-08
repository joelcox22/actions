#!/usr/bin/env -S deno run --allow-all

const files = Deno.readDir('.');

console.log('files in current directory:');

for await (const file of files) {
    console.log(file.name);
}

console.log('files in gitops-repo directory:');

const gitopsFiles = Deno.readDir('./gitops-repo');

for await (const file of gitopsFiles) {
    console.log(file.name);
}
