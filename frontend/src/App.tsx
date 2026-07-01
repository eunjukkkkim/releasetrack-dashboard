import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useEffect, useRef, useState } from "react";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { DeploymentCreate } from "./pages/deployments/DeploymentCreate";
import { DeploymentDetail } from "./pages/deployments/DeploymentDetail";
import { DeploymentList } from "./pages/deployments/DeploymentList";
import { ServiceDetail } from "./pages/services/ServiceDetail";
import { ServiceList } from "./pages/services/ServiceList";
import { Toaster } from "./components/ui/sonner";
import { cn } from "./lib/utils";

const MIN_SIDER = 150;
const MAX_SIDER = 400;
const DEFAULT_SIDER = 236;
const SIDER_WIDTH_KEY = "rt.siderWidth";

function readSiderWidth(): number {
  try {
    const raw = Number(localStorage.getItem(SIDER_WIDTH_KEY));
    if (Number.isFinite(raw) && raw >= MIN_SIDER && raw <= MAX_SIDER) {
      return raw;
    }
  } catch {
    /* localStorage 사용 불가 환경은 기본값 사용 */
  }
  return DEFAULT_SIDER;
}

export default function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [siderWidth, setSiderWidth] = useState<number>(readSiderWidth);
  const [resizing, setResizing] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const snapTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(SIDER_WIDTH_KEY, String(siderWidth));
    } catch {
      /* 저장 실패는 무시 (메모리 상태만 유지) */
    }
  }, [siderWidth]);

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    setResizing(true);
    let wasCollapsed = collapsed;
    // 접힘↔펼침 경계를 넘는 순간에만 짧게 transition 을 켜 부드럽게 스냅
    const triggerSnap = () => {
      setSnapping(true);
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = window.setTimeout(() => setSnapping(false), 200);
    };
    const onMove = (e: PointerEvent) => {
      // 임계값(MIN_SIDER=150) 밑으로 끌면 접힘 레일로, 이상이면 펼침 + 너비 적용
      if (e.clientX < MIN_SIDER) {
        if (!wasCollapsed) {
          wasCollapsed = true;
          setCollapsed(true);
          triggerSnap();
        }
      } else {
        if (wasCollapsed) {
          wasCollapsed = false;
          setCollapsed(false);
          triggerSnap();
        }
        setSiderWidth(Math.min(MAX_SIDER, e.clientX));
      }
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={cn(
        "app-shell",
        collapsed && "app-shell-collapsed",
        resizing && "app-shell-resizing",
        snapping && "app-shell-snapping",
      )}
      style={{ "--sider-width": `${siderWidth}px` } as CSSProperties}
    >
      <aside className="app-sider">
        <div className="sider-top">
          <Link to="/" className="brand" aria-label="ReleaseTrack Dashboard">
            <div className="brand-mark">
              <img
                src="https://cdn.imweb.me/thumbnail/20230307/dbb0c90027a6a.png"
                alt="ReleaseTrack"
                className="brand-mark-img"
              />
            </div>
            <div className="brand-copy">
              <div className="brand-title">ReleaseTrack</div>
              <div className="brand-subtitle">Dashboard</div>
            </div>
          </Link>
          <button
            type="button"
            className="sider-toggle"
            aria-label={collapsed ? "LNB 펼치기" : "LNB 접기"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelToggleIcon collapsed={collapsed} />
          </button>
        </div>
        <nav className="app-nav">
          <NavLink to="/" active={location.pathname === "/"}>
            <DashboardIcon />
            <span className="nav-label">Dashboard Home</span>
          </NavLink>
          <NavLink
            to="/services"
            active={location.pathname.startsWith("/services")}
          >
            <ServiceIcon />
            <span className="nav-label">Service List</span>
          </NavLink>
          <NavLink
            to="/deployments"
            active={location.pathname.startsWith("/deployments")}
          >
            <DeploymentIcon />
            <span className="nav-label">Deployment List</span>
          </NavLink>
        </nav>
      </aside>
      <div
        className={cn("sider-resizer", resizing && "is-dragging")}
        role="separator"
        aria-orientation="vertical"
        aria-label="사이드바 너비 조절"
        onPointerDown={startResize}
      />
      <main className="app-main">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/services" element={<ServiceList />} />
            <Route
              path="/services/:serviceId"
              element={<ServiceDetailRoute />}
            />
            <Route path="/deployments" element={<DeploymentList />} />
            <Route path="/deployments/create" element={<DeploymentCreate />} />
            <Route
              path="/deployments/:deploymentId"
              element={<DeploymentDetailRoute />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn("app-nav-link", active && "app-nav-link-active")}
    >
      {children}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="6" height="6" rx="1.6" />
      <rect x="9" y="1" width="6" height="6" rx="1.6" />
      <rect x="1" y="9" width="6" height="6" rx="1.6" />
      <rect x="9" y="9" width="6" height="6" rx="1.6" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="4" rx="1.3" />
      <rect x="1.5" y="9.5" width="13" height="4" rx="1.3" />
    </svg>
  );
}

function DeploymentIcon() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 1.5 L13.5 4 V9 L8 14.5 L2.5 9 V4 Z" />
      <path d="M8 6.5 v4" />
    </svg>
  );
}

function PanelToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={collapsed ? { transform: "rotate(180deg)" } : undefined}
    >
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M6.2 3v10" />
      <path d="M11 6.5 9.5 8l1.5 1.5" />
    </svg>
  );
}

function ServiceDetailRoute() {
  const { serviceId } = useParams();
  const parsedId = Number(serviceId);
  return Number.isFinite(parsedId) ? (
    <ServiceDetail serviceId={parsedId} />
  ) : (
    <Navigate to="/services" replace />
  );
}

function DeploymentDetailRoute() {
  const { deploymentId } = useParams();
  const parsedId = Number(deploymentId);
  return Number.isFinite(parsedId) ? (
    <DeploymentDetail deploymentId={parsedId} />
  ) : (
    <Navigate to="/deployments" replace />
  );
}
