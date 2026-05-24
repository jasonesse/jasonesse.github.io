import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayTimeline } from "../components/DayTimeline";
import { ControlBar } from "../components/ControlBar";
import { CityImage } from "../components/CityImage";
import { remapActivity } from "../engine/activityMapper";
import { loadCity } from "../engine/cityLoader";
import { useRunStore } from "../state/useRunStore";
import { trackEvent } from "../analytics/eventTracker";
import { saveKeptRunForToday } from "../history/cookieHistory";
import {
  getIgnoredActivityIdsByCity,
  ignoreActivityForCity,
} from "../history/ignoredActivitiesCookie";
import type { GeneratedActivity } from "../types";

export function RunPage() {
  const {
    run,
    keptIds,
    rerollActivity,
    removeActivityBySlot,
    keepActivity,
    clearRun,
  } = useRunStore();
  const nav = useNavigate();
  const [_rerollCount, setRerollCount] = useState(0);

  useEffect(() => {
    if (!run) nav("/");
  }, [run, nav]);

  if (!run) return null;

  async function handleReroll(activity: GeneratedActivity) {
    if (!run) return;
    try {
      const deck = await loadCity(run.city);
      const ignoredIds = getIgnoredActivityIdsByCity(run.city);
      // Exclude every activity currently in the run so the reroll never
      // produces a duplicate ID (which would break the "keep" highlight).
      const usedIds = run.activities.map((a) => a.id);
      const updated = remapActivity(
        deck.activityDeck,
        activity.timeSlot,
        usedIds,
        run.chaosLevel,
        run.groupDetails,
        ignoredIds
      );
      if (updated) {
        rerollActivity(updated);
        setRerollCount((c) => c + 1);
        trackEvent("ACTIVITY_REROLLED", {
          city: run.city,
          chaosLevel: run.chaosLevel,
          activityId: activity.id,
          timeSlot: activity.timeSlot,
        });
      } else {
        alert(
          "No compatible reroll option is available for this time slot with the current group and ignored activity filters."
        );
      }
    } catch {
      // silently ignore network errors during reroll
    }
  }

  function handleKeep(id: string) {
    keepActivity(id);
    const activity = run?.activities.find((a) => a.id === id);
    if (activity) {
      trackEvent("ACTIVITY_KEPT", {
        city: run?.city,
        chaosLevel: run?.chaosLevel,
        activityId: id,
        timeSlot: activity.timeSlot,
      });
    }
  }

  function handleExplore(activity: GeneratedActivity) {
    trackEvent("ACTIVITY_EXPLORED", {
      city: run?.city,
      activityId: activity.id,
      timeSlot: activity.timeSlot,
    });
    const query = encodeURIComponent(`${activity.finalText} ${run?.city ?? ""}`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  }

  function handleRegenerate() {
    clearRun();
    nav("/");
  }

  async function handleIgnore(activity: GeneratedActivity) {
    if (!run) return;

    ignoreActivityForCity(run.city, {
      id: activity.id,
      label: activity.finalText,
      category: activity.category,
    });

    try {
      const deck = await loadCity(run.city);
      const usedIds = run.activities
        .map((a) => a.id)
        .filter((id) => id !== activity.id);
      const ignoredIds = getIgnoredActivityIdsByCity(run.city);

      const updated = remapActivity(
        deck.activityDeck,
        activity.timeSlot,
        usedIds,
        run.chaosLevel,
        run.groupDetails,
        ignoredIds
      );

      if (updated) {
        rerollActivity(updated);
      } else {
        removeActivityBySlot(activity.timeSlot);
      }
    } catch {
      // Ignore action is already persisted in cookie even if reroll fails.
    }
  }

  function handleComplete() {
    if (run) {
      saveKeptRunForToday(run, keptIds);
    }
    trackEvent("RUN_COMPLETED", {
      city: run?.city,
      chaosLevel: run?.chaosLevel,
    });
    nav("/result");
  }

  return (
    <main className="run-page">
      <h2 className="run-page__title">{run.city} Run</h2>
      <CityImage city={run.city} className="run-page__city-image" alt={`${run.city} city preview`} />

      <DayTimeline
        activities={run.activities}
        keptIds={keptIds}
        onKeep={handleKeep}
        onReroll={handleReroll}
        onExplore={handleExplore}
        onIgnore={handleIgnore}
      />

      <ControlBar
        keptCount={keptIds.size}
        totalCount={run.activities.length}
        onRegenerate={handleRegenerate}
        onComplete={handleComplete}
      />
    </main>
  );
}
