type Props = {
  city: string;
  chaosLevel: number;
  keptCount: number;
  totalCount: number;
  rerollCount: number;
};

function chaosLabel(level: number): string {
  if (level < 30) return "Chill";
  if (level < 70) return "Adventurous";
  return "Wild";
}

export function ScorePanel({
  city,
  chaosLevel,
  keptCount,
  totalCount,
  rerollCount,
}: Props) {
  return (
    <div className="score-panel">
      <h3 className="score-panel__city">{city}</h3>
      <ul className="score-panel__stats">
        <li>
          Mode: <strong>{chaosLabel(chaosLevel)}</strong>
        </li>
        <li>
          Activities kept: <strong>{keptCount}/{totalCount}</strong>
        </li>
        <li>
          Rerolls used: <strong>{rerollCount}</strong>
        </li>
      </ul>
    </div>
  );
}
