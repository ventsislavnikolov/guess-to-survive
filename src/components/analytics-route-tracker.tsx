import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { trackPageView } from "@/lib/analytics";

const LAST_PAGEVIEW_STORAGE_KEY = "gts_last_pageview_href_v1";

export function AnalyticsRouteTracker() {
  const location = useRouterState({ select: (state) => state.location });
  const lastHrefRef = useRef<string | null>(null);
  const { hash, href, pathname, searchStr } = location;

  useEffect(() => {
    if (href === lastHrefRef.current) {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(LAST_PAGEVIEW_STORAGE_KEY);
      if (stored === href) {
        lastHrefRef.current = href;
        return;
      }
      window.sessionStorage.setItem(LAST_PAGEVIEW_STORAGE_KEY, href);
    } catch {
      // Ignore storage errors.
    }

    lastHrefRef.current = href;
    trackPageView({ hash, href, pathname, searchStr });
  }, [hash, href, pathname, searchStr]);

  return null;
}
