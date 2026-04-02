"use client";

import { useState, useEffect } from "react";

interface NotificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function NotificationToggle({
  enabled,
  onToggle,
}: NotificationToggleProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async () => {
    if (!supported) return;

    if (!enabled) {
      if (permission === "denied") {
        alert(
          "通知がブロックされています。ブラウザの設定から通知を許可してください。"
        );
        return;
      }

      if (permission !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          alert("通知の許可が必要です。");
          return;
        }
      }
    }

    onToggle(!enabled);
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${enabled
          ? "bg-apple-blue text-white focus:ring-apple-blue"
          : "bg-white text-apple-gray-900 ring-1 ring-apple-gray-200 focus:ring-apple-gray-400"
        }
      `}
    >
      <span className="text-base">{enabled ? "🔔" : "🔕"}</span>
      <span>{enabled ? "通知オン" : "通知オフ"}</span>
    </button>
  );
}
