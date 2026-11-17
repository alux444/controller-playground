import type { WheelInput } from "./mapping.ts";

chrome.runtime.onMessage.addListener(
  (
    message: { type?: string; input?: WheelInput },
    _sender,
    respond: (value: boolean) => void,
  ) => {
    if (message.type === "wheel-ping") {
      respond(true);
      return;
    }
    if (message.type !== "wheel-input" || !message.input) return;
    window.postMessage(
      { source: "controller-playground-phone-wheel", input: message.input },
      location.origin,
    );
  },
);
