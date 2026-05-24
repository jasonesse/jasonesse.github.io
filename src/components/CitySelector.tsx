type Props = {
  value: string;
  cities: Array<{ key: string; label: string }>;
  onChange: (city: string) => void;
};

export function CitySelector({ value, cities, onChange }: Props) {
  return (
    <div className="city-selector">
      <label htmlFor="city-select">Choose a city</label>
      <select
        id="city-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={cities.length === 0}
      >
        {cities.map((city) => (
          <option key={city.key} value={city.key}>
            {city.label}
          </option>
        ))}
      </select>
    </div>
  );
}
