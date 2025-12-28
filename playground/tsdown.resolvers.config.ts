import { defineConfig } from 'tsdown'

export default defineConfig({
  sourcemap: 'inline',
  target: 'esnext',
  platform: 'node',
  format: 'esm',
  external: ['@aws-appsync/utils'],
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
  clean: false,
  outExtensions: () => ({
    js: '.js',
  }),
})
