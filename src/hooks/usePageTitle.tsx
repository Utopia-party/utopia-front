import { useEffect } from 'react';

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    document.title = pageTitle ? `파티업 - ${pageTitle}` : '파티업';
  }, [pageTitle]);
}
