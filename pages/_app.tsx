import Head from "next/head";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import "../styles/globals.css";

// ── Session-id: grupperer alle hits fra samme besøg ──
// Lever i sessionStorage, så det nulstilles når fanen lukkes (= ét besøg).
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem("g_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      sessionStorage.setItem("g_sid", sid);
      sessionStorage.setItem("g_entry_done", "0");
    }
    return sid;
  } catch {
    return "nosession";
  }
}

// Første hit i en session = entry. Sættes kun én gang pr. session.
function takeEntryFlag(): boolean {
  try {
    if (sessionStorage.getItem("g_entry_done") === "1") return false;
    sessionStorage.setItem("g_entry_done", "1");
    return true;
  } catch {
    return false;
  }
}

function getUTM() {
  if (typeof window === "undefined") return {};
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source") ?? "",
      utm_medium: p.get("utm_medium") ?? "",
      utm_campaign: p.get("utm_campaign") ?? "",
    };
  } catch {
    return {};
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Engagement-tracking for nuværende side
  const currentPath = useRef<string>("");
  const enterTime = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);

  // Beregn aktuel scroll-dybde i procent
  const computeScrollPct = () => {
    if (typeof window === "undefined") return 0;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 100;
    return Math.round((window.scrollY / scrollable) * 100);
  };

  // Send et hit. prevEngagement medsendes hvis vi har data for forrige side.
  const trackHit = (path: string, opts: { entry?: boolean; prevEngagement?: any } = {}) => {
    const utm = getUTM();
    const payload: any = {
      path,
      sid: getSessionId(),
      entry: opts.entry ?? false,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      vw: typeof window !== "undefined" ? window.innerWidth : 0,
      lang: typeof navigator !== "undefined" ? navigator.language : "",
      ...utm,
    };
    if (opts.prevEngagement) {
      payload.prev_path = opts.prevEngagement.path;
      payload.prev_dwell_ms = opts.prevEngagement.dwell_ms;
      payload.prev_scroll_pct = opts.prevEngagement.scroll_pct;
    }
    fetch("/api/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  };

  // Send engagement for den side vi forlader (via beacon ved faktisk exit)
  const flushEngagementBeacon = () => {
    if (!currentPath.current) return;
    const data = {
      exit_beacon: true,
      sid: getSessionId(),
      prev_path: currentPath.current,
      prev_dwell_ms: Date.now() - enterTime.current,
      prev_scroll_pct: Math.max(maxScroll.current, computeScrollPct()),
    };
    try {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      navigator.sendBeacon("/api/hit", blob);
    } catch {
      // fallback
      fetch("/api/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  };

  // Initial page load
  useEffect(() => {
    const path = window.location.pathname;
    currentPath.current = path;
    enterTime.current = Date.now();
    maxScroll.current = 0;
    trackHit(path, { entry: takeEntryFlag() });

    // Opdater max scroll løbende
    const onScroll = () => {
      const pct = computeScrollPct();
      if (pct > maxScroll.current) maxScroll.current = pct;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Send engagement ved exit (luk fane / skift side i browseren)
    const onHide = () => {
      if (document.visibilityState === "hidden") flushEngagementBeacon();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushEngagementBeacon);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushEngagementBeacon);
    };
  }, []);

  // SPA-navigation: send engagement for forrige side sammen med nyt hit
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const newPath = url.split("?")[0];
      const prevEngagement = currentPath.current
        ? {
            path: currentPath.current,
            dwell_ms: Date.now() - enterTime.current,
            scroll_pct: Math.max(maxScroll.current, computeScrollPct()),
          }
        : undefined;

      trackHit(newPath, { entry: false, prevEngagement });

      // Nulstil for ny side
      currentPath.current = newPath;
      enterTime.current = Date.now();
      maxScroll.current = 0;
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
        <meta name="google-site-verification" content="l36Yfpb4X_h62m5tGYL9MRXgFSUpwBBtcX_5aSw193M" />
        <link rel="icon" type="image/png" href="/android-chrome-512x512.png" />
        <link rel="apple-touch-icon" href="/android-chrome-512x512.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
