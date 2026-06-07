'use client';

import { createContext, useContext } from 'react';

interface ImageConfig {
  baseUrl: string;
  domainRewriteMap: Record<string, string>;
}

const ImageConfigContext = createContext<ImageConfig>({
  baseUrl: '',
  domainRewriteMap: {},
});

export function useImageConfig() {
  return useContext(ImageConfigContext);
}

export { ImageConfigContext };
export type { ImageConfig };
