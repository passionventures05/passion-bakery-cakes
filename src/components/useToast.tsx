"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/** Small, non-blocking message at the bottom of the screen (replaces alert()). */
export function useToast(duration = 5000) {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback(
    (text: string) => {
      setMessage(text);
      setShow(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setShow(false), duration);
    },
    [duration]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const element = (
    <div className={show ? "lx-toast show" : "lx-toast"} role="status" aria-live="polite">
      <Icon name="info-circle" />
      <span>{message}</span>
    </div>
  );

  return { toast, element };
}
