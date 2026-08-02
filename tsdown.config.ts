import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    utils: './src/utils.ts',
    i18n: './src/i18n.ts',
    middy: './src/middy.ts',
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
  minify: {
    codegen: {
      removeWhitespace: true,
    },
    mangle: false,
    compress: false,
  },
})
