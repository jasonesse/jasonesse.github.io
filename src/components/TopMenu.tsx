import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function TopMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="top-menu">
      <button
        className="top-menu__trigger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>☰</span>
        <span>⋯</span>
      </button>

      {open && (
        <nav className="top-menu__panel" aria-label="Main menu">
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
      )}
    </div>
  );
}
