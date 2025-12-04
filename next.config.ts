import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 여기에 기존에 쓰시던 다른 설정이 있다면 넣으시면 됩니다.
  reactStrictMode: true,
};

const withPWA = withPWAInit({
  dest: "public", // 서비스 워커 파일이 생성될 위치 (public 폴더)
  
  // 개발 모드(npm run dev)에서도 PWA 작동 확인하려면 false로 설정
  // (나중에 배포할 땐 true로 바꾸거나, 이 줄을 지우면 개발모드에선 자동으로 꺼집니다)
  disable: false, 
  
  cacheOnFrontEndNav: true, // 페이지 이동 속도 향상
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true, // 개발 시 지저분한 로그 숨기기
  },
});

export default withPWA(nextConfig);