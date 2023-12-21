'use client';

import { useEffect, useState } from 'react';

type Location = {
  latitude: number;
  longitude: number;
};

export function useGeolocation(triggerOnMount = false) {
  const maxAge = process.env.NODE_ENV === 'development' ? 100 : 5 * 60 * 1000;
  const [geoLocationState, setGeoLocationState] = useState<{
    loading: boolean;
    blocked: boolean;
    location: Location | null;
    error: GeolocationPositionError | null;
  }>({
    loading: false,
    blocked: false,
    location: null,
    error: null,
  });

  function getCurrentLocation(): Promise<Location> {
    setGeoLocationState((prev) => ({ ...prev, loading: true }));

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocationState((prev) => ({
            ...prev,
            loading: false,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          } as Location);
        },
        (error) => {
          const blocked = error.code === 1;

          setGeoLocationState((prev) => ({
            ...prev,
            loading: false,
            blocked,
            error,
          }));

          reject(error);
        },
        {
          maximumAge: maxAge,
        }
      );
    });
  }

  useEffect(() => {
    if (!triggerOnMount) return;
    getCurrentLocation();
  });

  // check if user has denied location access
  useEffect(() => {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        setGeoLocationState((prev) => ({ ...prev, blocked: true }));
      }
    });
  }, []);

  return {
    ...geoLocationState,
    getCurrentLocation,
  };
}
