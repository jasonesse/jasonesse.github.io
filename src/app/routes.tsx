import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { RunPage } from "../pages/RunPage";
import { ResultPage } from "../pages/ResultPage";
import { HistoryPage } from "../pages/HistoryPage";
import { IgnoredActivitiesPage } from "../pages/IgnoredActivitiesPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/run" element={<RunPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/ignored" element={<IgnoredActivitiesPage />} />
    </Routes>
  );
}
