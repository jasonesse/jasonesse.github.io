type Props = {
  onRegenerate: () => void;
  onComplete: () => void;
  keptCount: number;
  totalCount: number;
};

export function ControlBar({
  onRegenerate,
  onComplete,
  keptCount,
  totalCount,
}: Props) {
  return (
    <div className="control-bar">
      <span className="control-bar__score">
        {keptCount} / {totalCount} kept
      </span>
      <button className="btn btn--secondary" onClick={onRegenerate}>
        Regenerate Day
      </button>
      <button
        className="btn btn--primary"
        onClick={onComplete}
        disabled={keptCount === 0}
      >
        Complete Run
      </button>
    </div>
  );
}
