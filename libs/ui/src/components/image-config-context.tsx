'use client';

import { createContext, useContext } from 'react';

interface ImageConfig {
  baseUrl: string;
}

const ImageConfigContext = createContext<ImageConfig>({ baseUrl: '' });

export function useImageConfig() {
  return useContext(ImageConfigContext);
}

export { ImageConfigContext };
export type { ImageConfig };
