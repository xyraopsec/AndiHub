import { useCallback, useEffect, useState } from "react";
import { Gamepad2, Film, Music, Bot, MessageCircle, X } from "lucide-react";
import { hrefs } from "@/lib/uiMarks";

const SEEN_KEY = "andihub-guide-seen";
export const OPEN_GUIDE_EVENT = "andihub-open-guide";

export function openGuide() {
  window.dispatchEvent(new CustomEvent(OPEN_GUIDE_EVENT));
}

function markGuideSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

function guideSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

const CARDS = [
  {
    icon: Gamepad2,
    title: "Play games",
    desc: "400+ free games that run right in your browser. Nothing to install.",
    url: hrefs.g(),
  },
  {
    icon: Film,
    title: "Watch movies",
    desc: "Films and shows, ready to stream.",
    url: hrefs.mo(),
  },
  {
    icon: Music,
    title: "Listen to music",
    desc: "Songs and playlists for studying or chilling.",
    url: hrefs.mu(),
  },
  {
    icon: Bot,
    title: "Ask the AI",
    desc: "Homework help, explanations, ideas — just ask.",
    url: "petezah://ai",
  },
  {
    icon: MessageCircle,
    title: "Chat",
    desc: "Talk with the community.",
    url: "petezah://chat",
  },
];

export function GuideCards({ onNavigate }: { onNavigate: (url: string) => void }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full"
      style={{ maxWidth: 560 }}
    >
      {CARDS.map(({ icon: Icon, title, desc, url }) => (
        <button
          key={title}
          type="button"
          onClick={() => {
            markGuideSeen();
            onNavigate(url);
          }}
          className="flex flex-col items-start gap-1 p-3 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            background: "hsla(220, 35%, 6%, 0.85)",
            border: "1px solid hsla(210, 40%, 80%, 0.14)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "hsla(0, 0%, 100%, 0.08)",
              color: "hsla(0, 0%, 100%, 0.92)",
            }}
          >
            <Icon size={16} />
          </span>
          <span className="text-[12px] font-bold" style={{ color: "hsla(0,0%,100%,0.95)" }}>
            {title}
          </span>
          <span className="text-[10px] leading-snug" style={{ color: "hsla(0,0%,100%,0.6)" }}>
            {desc}
          </span>
        </button>
      ))}
      <div
        className="flex flex-col justify-center gap-1 p-3 rounded-2xl col-span-2 sm:col-span-1"
        style={{
          background: "transparent",
          border: "1px dashed hsla(210, 40%, 80%, 0.2)",
        }}
      >
        <span className="text-[12px] font-bold" style={{ color: "hsla(0,0%,100%,0.85)" }}>
          Browse the web
        </span>
        <span className="text-[10px] leading-snug" style={{ color: "hsla(0,0%,100%,0.6)" }}>
          Type any address or search in the bar above — it opens privately.
        </span>
      </div>
    </div>
  );
}

export default function GuideOverlay({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [open, setOpen] = useState(() => !guideSeen());

  const close = useCallback(() => {
    markGuideSeen();
    setOpen(false);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_GUIDE_EVENT, handler);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "hsla(0, 0%, 0%, 0.72)", backdropFilter: "blur(8px)" }}
      onClick={close}
    >
      <div
        className="w-full rounded-3xl p-6 sm:p-7 max-h-[88vh] overflow-y-auto"
        style={{
          maxWidth: 600,
          background: "hsla(220, 30%, 7%, 0.98)",
          border: "1px solid hsla(210, 40%, 80%, 0.16)",
          boxShadow: "0 24px 80px hsla(0,0%,0%,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2
              className="font-extrabold tracking-tight"
              style={{ fontSize: 22, color: "hsla(0,0%,100%,0.97)" }}
            >
              Welcome to AndiHub
            </h2>
            <p className="text-[12px] mt-1" style={{ color: "hsla(0,0%,100%,0.6)" }}>
              Everything is free. Pick something to start — no account needed.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            title="Close"
            className="p-2 rounded-xl transition-all hover:scale-105 cursor-pointer"
            style={{
              background: "hsla(0,0%,100%,0.06)",
              border: "1px solid hsla(210,40%,80%,0.12)",
              color: "hsla(0,0%,100%,0.7)",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-4">
          <GuideCards
            onNavigate={(url) => {
              close();
              onNavigate(url);
            }}
          />
        </div>
        <button
          type="button"
          onClick={close}
          className="w-full mt-5 py-3 rounded-2xl text-[13px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          style={{ background: "hsla(0,0%,100%,0.94)", color: "hsla(220,30%,8%,1)" }}
        >
          Start exploring
        </button>
      </div>
    </div>
  );
}
