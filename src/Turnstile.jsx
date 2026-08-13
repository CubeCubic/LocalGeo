import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cloudflare-turnstile-script";

function Turnstile({ onTokenChange, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !window.turnstile || !containerRef.current) {
        return;
      }

      containerRef.current.replaceChildren();
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: "request",
        theme: "light",
        callback: (token) => onTokenChange(token),
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
      });
    }

    const existingScript = document.getElementById(SCRIPT_ID);

    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className="turnstile-wrap">
      <div ref={containerRef} />
      <p className="turnstile-note">Security verification helps protect this form from spam.</p>
    </div>
  );
}

export { SITE_KEY as turnstileSiteKey };
export default Turnstile;
