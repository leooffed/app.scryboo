import { useEffect } from "react";

interface AdBannerProps {
  slot: string;
  format?: "horizontal" | "rectangle" | "responsive";
  className?: string;
}

const ADSENSE_ID = import.meta.env.VITE_ADSENSE_ID as string | undefined;

/**
 * Bannière AdSense réutilisable.
 * - En dev / sans VITE_ADSENSE_ID : placeholder visuel (jamais de pub en local).
 * - En production avec ID : <ins class="adsbygoogle"> + push.
 */
export function AdBanner({ slot, format = "responsive", className = "" }: AdBannerProps) {
  const enabled = import.meta.env.PROD && !!ADSENSE_ID;

  useEffect(() => {
    if (!enabled) return;
    try {
      // @ts-expect-error adsbygoogle global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [enabled]);

  const sizeClass =
    format === "horizontal"
      ? "h-[90px] max-w-[728px] mx-auto"
      : format === "rectangle"
        ? "h-[250px] w-full max-w-[300px]"
        : "min-h-[100px] w-full";

  if (!enabled) {
    return (
      <div
        aria-hidden="true"
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs select-none ${sizeClass} ${className}`}
      >
        Publicité&nbsp;·&nbsp;AdSense&nbsp;[{format}]&nbsp;·&nbsp;slot&nbsp;{slot}
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format === "responsive" ? "auto" : format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
