import { useEffect, useRef, useState  } from "react";

export function useSmartAutoScroll<T extends HTMLElement>(
  dependencies: unknown[]
) {
  const containerRefChat = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Track user scroll position
  useEffect(() => {
    const el = containerRefChat.current;
    if (!el) return;

    const handleScroll = () => {
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setAutoScroll(isNearBottom);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll, dependencies]); // spread dependencies so ESLint sees them

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  };

  return {
    containerRefChat,
    bottomRef,
    autoScroll,
    scrollToBottom,
  };
}
