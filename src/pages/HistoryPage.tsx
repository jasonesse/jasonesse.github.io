import { useMemo, useState } from "react";
import { getHistoryByDate } from "../history/cookieHistory";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(todayDate());

  const records = useMemo(() => {
    if (!selectedDate) return [];
    return getHistoryByDate(selectedDate);
  }, [selectedDate]);

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
        {records.length === 0 && (
          <p className="history-page__empty">
            No kept activities found for this date.
          </p>
        )}

        {records.map((record, idx) => (
          <article key={`${record.date}-${record.city}-${idx}`} className="history-card">
            <h3>{record.city}</h3>
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
