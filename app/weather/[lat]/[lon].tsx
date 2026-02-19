import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function LatLonRedirect() {
  // this route exists so we can navigate using '/weather/[lat]/[lon]'
  // expo-router will map these segments into search params for the index route
  const params = useLocalSearchParams();
  const router = useRouter();

  // Build query and replace with index route that displays weather
  React.useEffect(() => {
    const lat = params.lat as string | undefined;
    const lon = params.lon as string | undefined;
    if (lat && lon) {
      router.replace(`/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
    }
  }, [params, router]);

  return null;
}
