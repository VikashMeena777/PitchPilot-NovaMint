"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";

const CONSENT_KEY = "pitchpilot_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Delay to avoid layout shift
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
      <div className="max-w-3xl mx-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Cookie className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white mb-1">
              We value your privacy
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We use essential cookies to make PitchPilot work. We&apos;d also like to use analytics 
              cookies to understand how you use our platform and improve your experience. 
              Read our{" "}
              <a href="/privacy" className="text-violet-400 hover:text-violet-300 underline">
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
