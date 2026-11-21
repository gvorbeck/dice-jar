import { createStore } from '@/lib/store';

interface UiStore {
  collapsedSections: Record<string, boolean>;

  // Actions
  toggleSection: (key: string) => void;
  setSectionCollapsed: (key: string, collapsed: boolean) => void;
  isSectionCollapsed: (key: string) => boolean;
}

export const useUiStore = createStore<UiStore>(
  'ui-store',
  (set, get) => ({
    collapsedSections: {},

    toggleSection: (key) =>
      set((state) => ({
        collapsedSections: {
          ...state.collapsedSections,
          [key]: !state.collapsedSections[key],
        },
      })),

    setSectionCollapsed: (key, collapsed) =>
      set((state) => ({
        collapsedSections: {
          ...state.collapsedSections,
          [key]: collapsed,
        },
      })),

    isSectionCollapsed: (key) => {
      return get().collapsedSections[key] || false;
    },
  }),
  (state) => ({
    collapsedSections: state.collapsedSections,
  }),
);
