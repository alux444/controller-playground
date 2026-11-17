import QRCode from "qrcode";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../src/ui-kit/components/Button.tsx";
import "../src/ui-kit/styles/theme.css";
import "../src/ui-kit/styles/kit.css";
import "./popup.css";

interface BridgeStatus {
  phase: "idle" | "starting" | "ready" | "error";
  join: string;
  message: string;
}

const initialStatus: BridgeStatus = {
  phase: "idle",
  join: "",
  message: "Open WMMTD, then connect.",
};

function Popup(): ReactElement {
  const [status, setStatus] = useState<BridgeStatus>(initialStatus);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function refresh(): Promise<void> {
      try {
        const next = (await chrome.runtime.sendMessage({
          type: "status",
        })) as BridgeStatus;
        setStatus(next);
      } catch {
        setStatus({
          phase: "error",
          join: "",
          message: "The extension could not start. Reload it in Chrome and try again.",
        });
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!status.join || !canvas.current) return;
    void QRCode.toCanvas(canvas.current, status.join, { width: 170, margin: 1 });
  }, [status.join]);

  async function connect(): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    setStatus({
      phase: "starting",
      join: "",
      message: "Connecting to the phone service…",
    });
    const next = (await chrome.runtime.sendMessage({
      type: "start",
      tabId: tab.id,
    })) as BridgeStatus;
    setStatus(next);
  }
  async function disconnect(): Promise<void> {
    const next = (await chrome.runtime.sendMessage({ type: "stop" })) as BridgeStatus;
    setStatus(next);
  }
  return (
    <main>
      <p className="eyebrow">CONTROLLER PLAYGROUND</p>
      <h1>Phone Wheel</h1>
      <p className="description">Use your phone to steer in Wangan Minimum Tune.</p>
      <p className="status" role="status">
        {status.message}
      </p>
      {status.phase === "ready" && (
        <div className="pairing">
          <canvas ref={canvas} aria-label="Scan to join" />
          <a href={status.join} target="_blank" rel="noreferrer">
            Open controller
          </a>
        </div>
      )}
      <div className="actions">
        {status.phase !== "ready" && (
          <Button disabled={status.phase === "starting"} onClick={() => void connect()}>
            Connect
          </Button>
        )}
        {(status.phase === "ready" || status.phase === "starting") && (
          <Button variant="secondary" onClick={() => void disconnect()}>
            Disconnect
          </Button>
        )}
      </div>
      <p className="footnote">
        In the game’s Controls → Controller tab, test Axis 0 and buttons 7 and 6.
      </p>
    </main>
  );
}

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Popup root is missing");
createRoot(app).render(<Popup />);
