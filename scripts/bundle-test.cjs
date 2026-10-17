const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['scripts/test-lunar.mjs'],
  bundle: true,
  platform: 'node',
  outfile: 'scripts/test-lunar.bundle.mjs',
  format: 'esm',
});
console.log('bundled');
