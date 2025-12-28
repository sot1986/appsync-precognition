// @ts-check
import antfu from '@antfu/eslint-config'
import appSyncPlugin from '@aws-appsync/eslint-plugin'
import tsEsLintParser from '@typescript-eslint/parser'

export default antfu({
  typescript: true,

}).append({
  files: ['src/**/*.ts'],
  ...appSyncPlugin.configs?.recommended,
  languageOptions: {
    parser: tsEsLintParser,
    parserOptions: {
      ecmaVersion: 2018,
      project: ['./tsconfig.json'],
    },
  },
  rules: {
    'antfu/no-import-dist': 'off', // Allow dist imports in playground
  },
})
