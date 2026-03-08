import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const DEFAULT_LOCATION = { lat: 19.076, long: 72.8777 };

export default function useWeather() {
  const [coords, setCoords] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, long: position.coords.longitude });
      },
      () => setCoords(DEFAULT_LOCATION),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 1000 * 60 * 15 },
    );
  }, []);

  const weatherQuery = useQuery({
    queryKey: ["weather", coords.lat, coords.long],
    queryFn: async () => {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.long}&current=temperature_2m,weather_code,is_day&forecast_days=1`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const locationQuery = useQuery({
    queryKey: ["location", coords.lat, coords.long],
    queryFn: async () => {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.long}&zoom=10`,
        { headers: { "Accept-Language": "en" } },
      );
      const addr = res.data?.address || {};
      return addr.city || addr.town || addr.village || addr.county || null;
    },
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  return {
    ...weatherQuery,
    locationName: locationQuery.data ?? null,
  };
}
