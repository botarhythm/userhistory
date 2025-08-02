import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    // ページタイトルを設定
    document.title = title;
    
    // LINEブラウザでのURL表示を制御
    if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Line')) {
      // LINEブラウザの場合、URL表示を最小限に抑える
      const originalTitle = document.title;
      
      // タイトルを短くしてURL表示を抑制
      document.title = title.length > 20 ? title.substring(0, 20) + '...' : title;
      
      // 数秒後に元のタイトルに戻す（URL表示が消えた後）
      const timer = setTimeout(() => {
        document.title = originalTitle;
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        document.title = originalTitle;
      };
    }
  }, [title]);
}; 