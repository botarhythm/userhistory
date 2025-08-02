import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    // ページタイトルを設定
    document.title = title;
  }, [title]);
}; 