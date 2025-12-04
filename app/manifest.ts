import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alba Manager - 사장님 필수앱', // 앱 전체 이름
    short_name: 'Alba Manager',         // 바탕화면 아이콘 아래에 뜰 짧은 이름
    description: '소상공인을 위한 간편 매장/급여 관리 서비스',
    start_url: '/',
    display: 'standalone', // 브라우저 주소창 없이 앱처럼 보이게 함
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon192.png', // 이 이미지가 필요합니다 (아래 설명 참조)
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon512.png', // 이 이미지가 필요합니다
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}