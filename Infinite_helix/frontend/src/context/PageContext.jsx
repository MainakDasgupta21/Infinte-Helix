import React, { createContext, useContext, useRef, useCallback } from 'react';

const PageContext = createContext(null);

export function PageContextProvider({ children }) {
  const pageDataRef = useRef({});

  const updatePageContext = useCallback((pageName, data) => {
    pageDataRef.current = {
      ...pageDataRef.current,
      [pageName]: { ...data, _updatedAt: Date.now() },
    };
  }, []);

  const getPageData = useCallback(() => pageDataRef.current, []);

  return (
    <PageContext.Provider value={{ getPageData, updatePageContext }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  return useContext(PageContext);
}
