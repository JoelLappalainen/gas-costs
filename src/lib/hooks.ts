'use client';

import { useEffect, useState } from 'react';

export function useGeolocation(revoke: boolean = false) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation(position),
      (error) => setError(error)
    );
  }, [revoke]);

  return { location, error };
}
