import type { Config } from "tailwindcss";

// 1. 빨간 줄 없애기 위해 ': Config' 글자 제거함
const config = {
  // 2. 핵심: 모든 Tailwind 클래스 앞에 'tw-'를 붙여야 작동하게 함 (이름 충돌 방지)
  prefix: "tw-",

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },

  // 3. 핵심: 기존 사이트 스타일 초기화 금지 (이게 있어야 기존 사이트가 안 망가짐)
  corePlugins: {
    preflight: false,
  },

  plugins: [],
};
export default config;