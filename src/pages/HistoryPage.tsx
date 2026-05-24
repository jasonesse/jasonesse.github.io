import { useMemo, useState } from "react";
import {
  deleteHistoryByDate,
  deleteHistoryRecordByIndex,
  getHistoryByDate,
} from "../history/cookieHistory";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [refreshKey, setRefreshKey] = useState(0);

  const records = useMemo(() => {
    if (!selectedDate) return [];
    return getHistoryByDate(selectedDate);
  }, [selectedDate, refreshKey]);

  function handleDeleteRecord(index: number) {
    deleteHistoryRecordByIndex(selectedDate, index);
    setRefreshKey((v) => v + 1);
  }

  function handleDeleteDate() {
    deleteHistoryByDate(selectedDate);
    setRefreshKey((v) => v + 1);
  }

  return (
    <main className="history-page">
      <header className="history-page__header">
        <h2>Kept Activity Calendar</h2>
        <p>
          Local cookies only. This feature stores kept activities by date and city,
          and does not store personal information.
        </p>
      </header>

      <section className="history-page__picker">
        <label htmlFor="history-date">Choose a date</label>
        <input
          id="history-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </section>

      <section className="history-page__results">
        {records.length > 0 && (
          <button className="btn btn--ignore" onClick={handleDeleteDate}>
            Delete All For This Date
          </button>
        )}

        {records.length === 0 && (
          <p className="history-page__empty">
            No kept activities found for this date.
          </p>
        )}

        {records.map((record, idx) => (
          <article key={`${record.date}-${record.city}-${idx}`} className="history-card">
            <div className="history-card__head">
              <h3>{record.city}</h3>
              <button
                className="btn btn--ignore"
                onClick={() => handleDeleteRecord(idx)}
                aria-label={`Delete ${record.city} record`}
              >
                Delete
              </button>
            </div>
            <ul>
              {record.keptItems.map((item) => (
                <li key={`${item.id}-${item.timeSlot}`}>
                  <strong>{item.timeSlot}:</strong> {item.finalText}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
