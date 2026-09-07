import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  eslintConfigPrettier,
  {
    files: ['**/*.spec.js'],
    languageOptions: { globals: globals.mocha },
  },
])
