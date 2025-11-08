// eslint.config.mjs
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  // 무시할 것들
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts', // Next가 자동 생성하는 파일
    ],
  },

  // TS/TSX 파일 규칙 (TS 파서 사용)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      next: nextPlugin,
    },
    rules: {
      // 필요시 조정
      'next/core-web-vitals': 'off',
      quotes: 'off',        // next-env.d.ts 등 충돌 방지용
      semi: ['error', 'always'],
    },
  },

  // JS/MJS/CJS 파일(예: 스크립트) 파싱 설정
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: { next: nextPlugin },
    rules: {
      'next/core-web-vitals': 'off',
    },
  },
];
