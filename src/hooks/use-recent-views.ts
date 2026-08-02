import { useEffect } from 'react';

interface ViewedProperty {
  id: string;
  title: string;
  type: string;
  operation_type: string;
  price: number;
  currency: string;
  city: string;
  images: string[];
  viewedAt: string;
}

const STORAGE_KEY = 'recently_viewed';
const MAX_RECENT = 20;

export function useRecentViews() {
  const addToRecent = (property: Omit<ViewedProperty, 'viewedAt'>) => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const recent: ViewedProperty[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to update timestamp)
      const filtered = recent.filter((p) => p.id !== property.id);

      // Add new property at the beginning
      const updated = [
        { ...property, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENT);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  const getRecent = (): ViewedProperty[] => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return [];
    }
  };

  const clearRecent = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  };

  return { addToRecent, getRecent, clearRecent };
}

// Hook to automatically track views when visiting property detail pages
export function useTrackPropertyView(propertyId: string | null, property: any | null) {
  const { addToRecent } = useRecentViews();

  useEffect(() => {
    if (!propertyId || !property) return;

    addToRecent({
      id: propertyId,
      title: property.title || '',
      type: property.type || '',
      operation_type: property.operation_type || '',
      price: property.price || 0,
      currency: property.currency || 'USD',
      city: property.city || '',
      images: property.images || [],
    });
  }, [propertyId, property, addToRecent]);
}
