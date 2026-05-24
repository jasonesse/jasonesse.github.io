import type { GeneratedActivity } from "../types";
import { ActivityCard } from "./ActivityCard";

type Props = {
  activities: GeneratedActivity[];
  keptIds: Set<string>;
  onKeep: (id: string) => void;
  onReroll: (activity: GeneratedActivity) => void;
  onExplore: (activity: GeneratedActivity) => void;
  onIgnore: (activity: GeneratedActivity) => void;
};

export function DayTimeline({
  activities,
  keptIds,
  onKeep,
  onReroll,
  onExplore,
  onIgnore,
}: Props) {
  return (
    <div className="day-timeline">
      {activities.map((a) => (
        <ActivityCard
          key={a.timeSlot}
          activity={a}
          isKept={keptIds.has(a.id)}
          onKeep={() => onKeep(a.id)}
          onReroll={() => onReroll(a)}
          onExplore={() => onExplore(a)}
          onIgnore={() => onIgnore(a)}
        />
      ))}
    </div>
  );
}
