import angularPlugin from '@angular-eslint/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import zetaPlugin from 'eslint-plugin-zeta';
import parser from '@typescript-eslint/parser';
import { join } from 'path';

const tsconfigPath = join(process.cwd(), 'tsconfig.json');

export default [
  {
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: tsconfigPath, // Dynamischer Pfad zur tsconfig.json
        tsconfigRootDir: process.cwd(), // Arbeitsverzeichnis als Basis
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        browser: true,
        es6: true,
      },
    },
    ignores: [
      "projects/xyna/src/app/zeta/lint/plugins/eslint-plugin-zeta/index.js",
      "projects/xyna/src/app/zeta/lint/config/base/eslint.config.mjs",
      "projects/xyna/src/app/zeta/lint/config/strict/eslint.config.mjs",
      "projects/xyna/src/app/zeta/lint/config/eslint.config.mjs",
      "**/node_modules/**",
      "**/dist/**",
      "**/*.min.js",
    ],
    plugins: {
      '@angular-eslint': angularPlugin,
      '@typescript-eslint': typescriptPlugin,
      import: importPlugin,
      zeta: zetaPlugin,
    },
    rules: {
      // Allgemeine Regeln
    },
  },
  {
    files: ['projects/xyna/src/app/**/*.ts'],
    rules: {
      // TypeScript-spezifische Regeln
    },
  },
  {
    files: ['*.html', '*.css', '*.scss'],
    rules: {
      // Regeln für HTML/CSS/SCSS-Dateien
    },
  },
];
