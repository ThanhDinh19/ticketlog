import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  function toggleSidebar() {
    if (window.innerWidth < 992) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setDesktopSidebarCollapsed((prev) => !prev);
    }
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  function openMobileSidebar() {
    if (window.innerWidth < 992) {
      setMobileSidebarOpen(true);
    }
  }

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.innerWidth >= 992) return;

      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    }

    function handleTouchMove(e: TouchEvent) {
      if (window.innerWidth >= 992) return;

      touchEndX.current = e.touches[0].clientX;
    }

    function handleTouchEnd() {
      if (window.innerWidth >= 992) return;
      if (touchStartX.current === null || touchEndX.current === null) return;

      const diffX = touchEndX.current - touchStartX.current;

      if (diffX > 80) {
        openMobileSidebar();
      }

      if (diffX < -80) {
        closeMobileSidebar();
      }

      touchStartX.current = null;
      touchEndX.current = null;
    }

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div
      className={[
        "app-wrapper",
        mobileSidebarOpen ? "mobile-sidebar-open" : "",
        desktopSidebarCollapsed ? "desktop-sidebar-collapsed" : "",
      ].join(" ")}
    >
      <Sidebar onCloseMobile={closeMobileSidebar} />

      {isMobile && (
        <div
          className={`sidebar-overlay ${mobileSidebarOpen ? "show" : ""}`}
          onClick={closeMobileSidebar}
        />
      )}

      <div className="main-content">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}