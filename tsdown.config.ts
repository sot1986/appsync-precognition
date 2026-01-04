import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    utils: './src/utils.ts',
  },
  dts: {
    sourcemap: true,
  },
  sourcemap: 'hidden',
  skipNodeModulesBundle: true,
  outExtensions: () => ({
    dts: '.d.ts',
    js: '.js',
  }),
  clean: true,
  format: 'esm',
  minify: true,
})
