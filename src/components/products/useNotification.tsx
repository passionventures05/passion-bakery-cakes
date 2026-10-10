"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

type NoticeType = "added" | "removed";
interface View {
  message: string;
  type: NoticeType | null;
  phase: "idle" | "show" | "hide";
}

/** Queued toast notification (3.5s visible, 0.6s gap) matching the original behaviour. */
export function useNotification() {
  const [view, setView] = useState<View>({
    message: "Product added to cart!",
    type: null,
    phase: "idle",
  });
  const queue = useRef<{ message: string; type: NoticeType }[]>([]);
  const showing = useRef(false);
  const timers = useRef<number[]>([]);

  const process = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      showing.current = false;
      return;
    }
    showing.current = true;
    setView({ message: next.message, type: next.type, phase: "show" });
    timers.current.push(
      window.setTimeout(() => {
        setView((v) => ({ ...v, phase: "hide" }));
        timers.current.push(window.setTimeout(process, 600));
      }, 3500)
    );
  }, []);

  const notify = useCallback(
    (message: string, type: NoticeType = "added") => {
      queue.current.push({ message, type });
      if (!showing.current) process();
    },
    [process]
  );

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => clearTimeout(id));
  }, []);

  const element = (
    <div
      id="notification"
      role="status"
      aria-live="polite"
      className={["notification", view.type, view.phase === "idle" ? null : view.phase]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon name={view.type === "removed" ? "trash" : "check-circle"} />
      <span id="notification-text">{view.message}</span>
    </div>
  );

  return { notify, element };
}
