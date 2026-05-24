type Props = {
  value: number;
  onChange: (level: number) => void;
};

function chaosLabel(level: number): string {
  if (level < 30) return "Chill";
  if (level < 70) return "Adventurous";
  return "Wild";
}

export function ChaosSlider({ value, onChange }: Props) {
  return (
    <div className="chaos-slider">
      <label htmlFor="chaos-range">
        Chaos Level: <strong>{chaosLabel(value)}</strong> ({value})
      </label>
      <input
        id="chaos-range"
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="chaos-ticks">
        <span>Chill</span>
        <span>Adventurous</span>
        <span>Wild</span>
      </div>
    </div>
  );
}
