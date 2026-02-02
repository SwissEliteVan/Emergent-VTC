'use client';

import { useMemo } from 'react';

const fallbackSuggestions = ['Domicile', 'Travail', 'Aéroport GVA'];

export function useDestinationPredictor() {
  const suggestions = useMemo(() => {
    if (typeof window === 'undefined') return fallbackSuggestions;
    const stored = window.localStorage.getItem('romuo-destinations');
    const history = stored ? JSON.parse(stored) as string[] : [];
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const timeBased = hour < 10 ? 'Travail' : hour > 18 ? 'Domicile' : 'Centre-ville';
    const dayBased = day === 5 ? 'Aéroport GVA' : day === 0 ? 'Gare Cornavin' : 'Centre-ville';

    return Array.from(new Set([...history, timeBased, dayBased, ...fallbackSuggestions])).slice(0, 5);
  }, []);

  const saveDestination = (destination: string) => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('romuo-destinations');
    const history = stored ? JSON.parse(stored) as string[] : [];
    const updated = [destination, ...history.filter((item) => item !== destination)].slice(0, 6);
    window.localStorage.setItem('romuo-destinations', JSON.stringify(updated));
  };

  return { suggestions, saveDestination };
}
