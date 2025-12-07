import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '이지 알바 - 사장님 필수앱',
    short_name: '이지 알바',
    description: '소상공인을 위한 간편 매장/급여 관리 서비스',
    
    // ✅ 실제 도메인 주소 (한글 도메인 퓨니코드)
    start_url: 'https://www.xn--9g3bp2okvbh9c.kr',
    
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon192.png',
        sizes: '192x192',
        type: 'image/png',
        // ✅ 에러 해결: 뒤에 'as any'를 붙여서 빨간 줄을 없앱니다.
        purpose: 'any maskable' as any, 
      },
      {
        src: '/icon512.png',
        sizes: '512x512',
        type: 'image/png',
        // ✅ 여기도 동일하게 수정
        purpose: 'any maskable' as any,
      },
    ],
  };
}