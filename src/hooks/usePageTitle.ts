import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    // LINEブラウザでのURL表示を制御
    if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Line')) {
      // LINEブラウザの場合、より短いタイトルを使用
      const shortTitle = 'Botarhythm';
      document.title = shortTitle;
      
      // 動的にメタタグを追加してURL表示を抑制
      const addMetaTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      // 追加のメタタグを設定
      addMetaTag('apple-mobile-web-app-capable', 'yes');
      addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
      addMetaTag('format-detection', 'telephone=no');
      
      // 数秒後に少し長いタイトルに変更（URL表示が抑制された後）
      const timer = setTimeout(() => {
        document.title = title.length > 15 ? title.substring(0, 15) + '...' : title;
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        document.title = title;
      };
    } else {
      // 通常のブラウザでは元のタイトルを使用
      document.title = title;
    }
  }, [title]);
}; 