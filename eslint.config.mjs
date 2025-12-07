// eslint.config.mjs
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  // 👇 [수정] 무시할 파일 목록에 'public/**'을 추가했습니다.
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts', 
      'public/**',      // 👈 이 줄을 추가하세요! (public 폴더 통째로 무시)
    ],
  },

  // TS/TSX 파일 규칙 (나머지는 그대로 둠)
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
      'next/core-web-vitals': 'off',
      quotes: 'off',
      semi: ['error', 'always'],
    },
  },

  // JS/MJS/CJS 파일 파싱 설정
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