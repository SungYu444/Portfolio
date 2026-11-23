# ASCII Sharks

The TypeScript engine in `src/` is vendored from [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks), commit `fff1af0a4d1ba6315d02982bd904b83ca016a14e`.

The upstream repository is MIT licensed; its license is included alongside the source. `shark-entry.ts` configures the page's cast and display options, and `assets/ascii-sharks.js` is the browser bundle used by `index.html`. The local `World.splash` modification also startles sharks within the splash radius and steers them away briefly.

To rebuild the browser bundle with esbuild 0.25.12, run `esbuild shark-entry.ts --bundle --minify --format=iife --target=es2020 --outfile=assets/ascii-sharks.js` from the portfolio root.
