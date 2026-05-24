import { useEffect, useMemo, useState } from "react";

type Props = {
  city: string;
  className?: string;
  alt?: string;
};

const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

function toCitySlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

export function CityImage({ city, className = "", alt }: Props) {
  const slug = useMemo(() => toCitySlug(city), [city]);
  const [extIndex, setExtIndex] = useState(0);

  useEffect(() => {
    setExtIndex(0);
  }, [slug]);

  if (!slug || extIndex >= EXTENSIONS.length) return null;

  const src = `/city-images/${slug}.${EXTENSIONS[extIndex]}`;

  return (
    <img
      className={`city-image ${className}`.trim()}
      src={src}
      alt={alt ?? `${city} preview`}
      loading="lazy"
      onError={() => setExtIndex((i) => i + 1)}
    />
  );
}
