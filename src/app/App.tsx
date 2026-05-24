import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { AppRoutes } from "./routes";
import { TopMenu } from "../components/TopMenu";
import { useRunStore } from "../state/useRunStore";

export default function App() {
  const ensureCurrentDay = useRunStore((s) => s.ensureCurrentDay);

  useEffect(() => {
    ensureCurrentDay();

    const onFocus = () => ensureCurrentDay();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        ensureCurrentDay();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ensureCurrentDay]);

  return (
    <BrowserRouter>
      <TopMenu />
      <div className="app-routes">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
