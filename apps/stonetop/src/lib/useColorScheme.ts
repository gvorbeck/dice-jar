import { useState, useEffect, useCallback } from 'react';
import { store } from '@dice-jar/browser';

type ColorScheme = 'dark' | 'light';

const STORAGE_KEY = 'hearthfire-color-scheme';

const getInitial = (): ColorScheme => {
  const v = store.get(STORAGE_KEY);
  if (v === 'light' || v === 'dark') return v;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const applyTheme = (scheme: ColorScheme) => {
  if (scheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

export const useColorScheme = () => {
  const [scheme, setScheme] = useState<ColorScheme>(getInitial);

  useEffect(() => {
    applyTheme(scheme);
    store.set(STORAGE_KEY, scheme);
  }, [scheme]);

  const toggle = useCallback(() => {
    setScheme((s) => (s === 'dark' ? 'light' : 'dark'));
  }, []);

  return { scheme, toggle };
};
