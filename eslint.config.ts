import * as eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import * as tseslint from 'typescript-eslint';

const config: ReturnType<typeof defineConfig> = defineConfig(
  eslint.configs.recommended,
  // https://typescript-eslint.io/getting-started/typed-linting
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Note: there should be no other properties in this object
    // https://eslint.org/docs/latest/use/configure/migration-guide#ignoring-files
    // https://github.com/eslint/eslint/discussions/17429
    ignores: ['dist'],
  },
  {
    rules: {
      '@typescript-eslint/return-await': ['error', 'always'],
      curly: 'error',
      'object-shorthand': 'error',
    },
  },
);

export default config;
