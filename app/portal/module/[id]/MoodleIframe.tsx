"use client";

import { useState, useEffect } from "react";

interface Props {
  moduleUrl: string;
  moduleName: string;
}

export default function MoodleIframe({ moduleUrl, moduleName }: Props) {
  const [src, setSrc] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "autologin" | "fallback">("loading");

  useEffect(() => {
    fetch("/api/moodle/autologin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl: moduleUrl }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setSrc(data.url);
          setStatus("autologin");
        } else {
          setSrc(moduleUrl);
          setStatus("fallback");
        }
      })
      .catch(() => {
        setSrc(moduleUrl);
        setStatus("fallback");
      });
  }, [moduleUrl]);

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          background: "#0d1526",
          borderRadius: "1rem",
          overflow: "hidden",
          border: "1px solid #2d3a4f",
        }}
      >
        <iframe
          src={src}
          title={moduleName}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="fullscreen; autoplay"
        />
      </div>
      {status === "loading" && (
        <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.5rem" }}>
          Setting up your session…
        </p>
      )}
      {status === "fallback" && (
        <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.5rem" }}>
          If the content does not load above, you may need to log into Moodle first.
        </p>
      )}
    </div>
  );
}
