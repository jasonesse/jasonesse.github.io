import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function TopMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={`top-menu ${open ? "is-open" : ""}`}>
      <button
        className="top-menu__trigger"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="main-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <span>☰</span>
      </button>

      <button
        type="button"
        className="top-menu__backdrop"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <nav
        id="main-drawer"
        className="top-menu__panel"
        aria-label="Main menu"
        aria-hidden={!open}
      >
        <div className="top-menu__panel-header">
          <p>Menu</p>
          <button
            type="button"
            className="top-menu__close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <Link to="/" className="top-menu__link">
          Home
        </Link>
        <Link to="/run" className="top-menu__link">
          Run
        </Link>
        <Link to="/result" className="top-menu__link">
          Result
        </Link>
        <Link to="/history" className="top-menu__link">
          Calendar
        </Link>
        <Link to="/ignored" className="top-menu__link">
          Ignored
        </Link>
      </nav>
    </div>
  );
}
