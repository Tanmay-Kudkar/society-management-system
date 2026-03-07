import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const DEFAULT_LOCATION = { lat: 19.076, long: 72.8777 };

export default function useWeather() {
  const [coords, setCoords] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const success = (position) => {
      setCoords({
        lat: position.coords.latitude,
        long: position.coords.longitude,
      });
    };

    const error = () => {
      setCoords(DEFAULT_LOCATION);
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 1000 * 60 * 15,
    });
  }, []);

  return useQuery({
    queryKey: ["weather", coords.lat, coords.long],
    queryFn: async () => {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.long}&current=temperature_2m,weather_code,is_day&forecast_days=1`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });
}
