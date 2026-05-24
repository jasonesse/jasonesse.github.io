type Props = {
  value: string;
  onChange: (city: string) => void;
};

const CITIES = [
  { value: "montreal", label: "Montreal" },
  { value: "rome", label: "Rome" },
  { value: "barcelona", label: "Barcelona" },
];

export function CitySelector({ value, onChange }: Props) {
  return (
    <div className="city-selector">
      <label htmlFor="city-select">Choose a city</label>
      <select
        id="city-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {CITIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
