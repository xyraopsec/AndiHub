import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";
import { MentionsText } from "@/lib/mentions";

const SEEN_KEY = "pz-announcement-seen-ids";
const LEGACY_SEEN_KEY = "pz-announcement-seen";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at?: number;
}

function readSeen(): Set<string> {
  const out = new Set<string>();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) {
          if (typeof id === "string" && id) out.add(id);
        }
      }
    }
    const legacy = localStorage.getItem(LEGACY_SEEN_KEY);
    if (legacy) out.add(legacy);
  } catch {}
  return out;
}

function writeSeen(ids: Set<string>) {
  try {
    const list = [...ids].slice(-80);
    localStorage.setItem(SEEN_KEY, JSON.stringify(list));
  } catch {}
}

export default function GlobalAnnouncement({
  onNavigate,
}: {
  onNavigate?: (url: string) => void;
}) {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const item = queue[0] || null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements/active", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const list: Announcement[] = Array.isArray(d.announcements)
          ? d.announcements
          : d.announcement
            ? [d.announcement]
            : [];
        const seen = readSeen();
        const pending = list.filter((a) => a?.id && !seen.has(a.id));
        if (pending.length) setQueue(pending);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    if (!item) return;
    const seen = readSeen();
    seen.add(item.id);
    writeSeen(seen);
    setQueue((prev) => prev.slice(1));
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "hsla(220, 40%, 4%, 0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              background: "hsla(220, 30%, 9%, 0.98)",
              border: "1px solid hsla(210, 40%, 80%, 0.12)",
              boxShadow: "0 24px 80px hsla(0,0%,0%,0.5)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderBottom: "1px solid hsla(210, 40%, 80%, 0.1)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "hsla(213, 70%, 55%, 0.2)",
                  border: "1px solid hsla(213, 70%, 55%, 0.35)",
                }}
              >
                <Megaphone size={13} style={{ color: "hsl(213 80% 70%)" }} />
              </div>
              <h2 style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 700, color: "hsla(0,0%,96%,0.95)" }}>
                {item.title}
              </h2>
              <button
                onClick={dismiss}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "hsla(0,0%,100%,0.45)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: "16px 18px 18px" }}>
              <MentionsText
                text={item.content}
                onNavigate={onNavigate}
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "hsla(0,0%,100%,0.72)",
                  display: "block",
                }}
              />
              <button
                onClick={dismiss}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid hsla(213, 60%, 50%, 0.4)",
                  background: "hsla(213, 70%, 48%, 0.25)",
                  color: "hsl(213 90% 78%)",
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
