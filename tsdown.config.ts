import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  dts: {
    sourcemap: true,
  },
  sourcemap: 'inline',
  skipNodeModulesBundle: true,
  outExtensions: () => ({
    dts: '.d.ts',
    js: '.js',
  }),
  clean: true,
  format: 'esm',
})
