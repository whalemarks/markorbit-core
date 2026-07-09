export default [
  {
    ignores: [
      'coverage/',
      'dist/',
      'node_modules/',
      'pnpm-lock.yaml',
      'tests/**/*.ts',
      'src/**/*.ts',
      'vitest.config.ts'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error'
    }
  }
];
