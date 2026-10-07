import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'assets/mockServiceWorker.js'] },
  {
    // Node scripts (scripts/*.mjs, this config). The measurement script also runs callbacks
    // inside the browser page, hence the browser globals.
    extends: [js.configs.recommended],
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
