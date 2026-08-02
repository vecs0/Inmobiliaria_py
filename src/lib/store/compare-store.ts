import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProperty {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  city: string;
  sqm: number;
}

interface CompareState {
  selectedIds: string[];
  selectedProperties: CompareProperty[];
  addProperty: (property: CompareProperty) => void;
  removeProperty: (id: string) => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      selectedIds: [],
      selectedProperties: [],
      addProperty: (property) =>
        set((state) => {
          if (state.selectedIds.includes(property.id)) return state;
          if (state.selectedIds.length >= 3) {
            // Opcional: Podríamos lanzar un toast aquí, pero lo manejaremos en la UI
            return state;
          }
          return {
            selectedIds: [...state.selectedIds, property.id],
            selectedProperties: [...state.selectedProperties, property],
          };
        }),
      removeProperty: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.filter((pid) => pid !== id),
          selectedProperties: state.selectedProperties.filter((p) => p.id !== id),
        })),
      clearAll: () => set({ selectedIds: [], selectedProperties: [] }),
    }),
    {
      name: 'property-compare-storage',
    }
  )
);
