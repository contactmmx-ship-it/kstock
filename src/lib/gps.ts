import { useState, useEffect, useCallback } from 'react';
import { GPSLocation } from './types';

export function useGPS() {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ city: string; locality: string }> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.road || '';
      return { city, locality };
    } catch {
      return { city: '', locality: '' };
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<GPSLocation | null> => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      return null;
    }
    setPermissionStatus('loading');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const { city, locality } = await reverseGeocode(latitude, longitude);
          const loc: GPSLocation = { latitude, longitude, city, locality, accuracy };
          setLocation(loc);
          setPermissionStatus('granted');
          resolve(loc);
        },
        () => {
          setPermissionStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, [reverseGeocode]);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        } else if (result.state === 'denied') {
          setPermissionStatus('denied');
        }
      });
    }
  }, [requestLocation]);

  return { location, permissionStatus, requestLocation };
}
