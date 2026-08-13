import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Admin from "./Admin.jsx";
import App from "./App.jsx";
import Legal from "./Legal.jsx";
import Tracking from "./Tracking.jsx";

function getTrackingRoute() {
  const match = window.location.hash.match(/^#\/track\/([^?]+)\?(.+)$/);

  if (!match) {
    return null;
  }

  const trackingKey = new URLSearchParams(match[2]).get("key");

  return trackingKey
    ? { requestId: decodeURIComponent(match[1]), trackingKey }
    : null;
}

function Router() {
  const [hash, setHash] = useState(window.location.hash);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const currentPath = window.location.pathname.replace(/\/$/, "");
  const trackingRoute = getTrackingRoute();
  const legalRoute = window.location.hash.match(/^#\/(privacy|terms)$/)?.[1];

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (currentPath === `${basePath}/admin`) {
    return <Admin />;
  }

  if (trackingRoute) {
    return <Tracking key={hash} {...trackingRoute} />;
  }

  if (legalRoute) {
    return <Legal key={hash} page={legalRoute} />;
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
