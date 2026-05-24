import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const DESKTOP_QUERY = "(min-width: 900px)";
const DESKTOP_COLLAPSE_STORAGE_KEY = "crg_nav_collapsed_v1";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/run", label: "Run", icon: "▶" },
  { to: "/result", label: "Result", icon: "✓" },
  { to: "/history", label: "Calendar", icon: "🗓" },
  { to: "/ignored", label: "Ignored", icon: "🚫" },
] as const;

export function TopMenu() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(DESKTOP_QUERY).matches
      : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DESKTOP_COLLAPSE_STORAGE_KEY) === "1";
  });

  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const syncDesktop = () => setIsDesktop(media.matches);
    syncDesktop();

    media.addEventListener("change", syncDesktop);
    return () => media.removeEventListener("change", syncDesktop);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DESKTOP_COLLAPSE_STORAGE_KEY,
      desktopCollapsed ? "1" : "0"
    );
  }, [desktopCollapsed]);

  useEffect(() => {
    const shouldLockScroll = !isDesktop && mobileOpen;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sidebarOpen = isDesktop ? true : mobileOpen;

  function handleMenuToggle() {
    if (isDesktop) {
      setDesktopCollapsed((prev) => !prev);
      return;
    }

    setMobileOpen((prev) => !prev);
  }

  return (
    <>
      <header className="top-menu__bar">
        <button
          className="top-menu__trigger"
          aria-label={
            isDesktop
              ? desktopCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
              : "Open navigation menu"
          }
          aria-expanded={isDesktop ? !desktopCollapsed : mobileOpen}
          aria-controls="main-drawer"
          onClick={handleMenuToggle}
        >
          <span>☰</span>
        </button>

        <h1 className="top-menu__brand">City Run Generator</h1>
      </header>

      {!isDesktop && (
        <button
          type="button"
          className={`top-menu__backdrop ${mobileOpen ? "is-open" : ""}`}
          aria-hidden={!mobileOpen}
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="main-drawer"
        className={`top-menu ${
          isDesktop
            ? desktopCollapsed
              ? "is-collapsed"
              : "is-expanded"
            : mobileOpen
            ? "is-open"
            : ""
        }`}
        aria-label="Main menu"
        aria-hidden={!sidebarOpen}
      >
        <nav className="top-menu__panel">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `top-menu__link ${isActive ? "is-active" : ""}`
              }
            >
              <span className="top-menu__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="top-menu__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
