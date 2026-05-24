import { useEffect, useState } from "react";
import { getFallbackCityByKey, loadCityCatalog } from "../cities/cityCatalog";

type Props = {
  city: string;
  className?: string;
  alt?: string;
};

export function CityImage({ city, className = "", alt }: Props) {
  const fallbackEntry = getFallbackCityByKey(city);
  const [src, setSrc] = useState<string | null>(fallbackEntry?.imagePath ?? null);

  useEffect(() => {
    let cancelled = false;

    setSrc(fallbackEntry?.imagePath ?? null);

    loadCityCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const entry = catalog.find((item) => item.key === city) ?? fallbackEntry;
        setSrc(entry?.imagePath ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(fallbackEntry?.imagePath ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city, fallbackEntry?.imagePath]);

  if (!src) return null;

  return (
    <img
      className={`city-image ${className}`.trim()}
      src={src}
      alt={alt ?? `${city} preview`}
      loading="lazy"
    />
  );
}
