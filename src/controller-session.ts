import { useCallback, useEffect, useRef, useState } from "react";
import { neutralState, type ControllerState } from "../server/protocol.ts";
import { socketUrl } from "./dom.ts";

interface SessionMessage {
  type: string;
  slot?: number;
  taken?: number[];
}

export interface ControllerSession {
  input: ControllerState;
  selectedSlot: number | undefined;
  takenSlots: number[];
  connected: boolean;
  status: string;
  select: (slot: number) => void;
  update: (values: Partial<ControllerState>) => void;
  neutral: () => void;
}

export function useControllerSession(room: string): ControllerSession {
  const [input, setInput] = useState<ControllerState>({ ...neutralState });
  const [selectedSlot, setSelectedSlot] = useState<number>();
  const [takenSlots, setTakenSlots] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const socket = useRef<WebSocket | undefined>(undefined);
  const currentInput = useRef<ControllerState>({ ...neutralState });
  const currentSlot = useRef<number | undefined>(undefined);

  const transmit = useCallback((): void => {
    if (
      currentSlot.current !== undefined &&
      socket.current?.readyState === WebSocket.OPEN
    ) {
      socket.current.send(JSON.stringify(currentInput.current));
    }
  }, []);

  const update = useCallback(
    (values: Partial<ControllerState>): void => {
      currentInput.current = { ...currentInput.current, ...values };
      setInput(currentInput.current);
      transmit();
    },
    [transmit],
  );

  const neutral = useCallback((): void => {
    update({ ...neutralState, mode: currentInput.current.mode });
  }, [update]);

  const select = useCallback(
    (slot: number): void => {
      if (socket.current?.readyState !== WebSocket.OPEN) return;
      neutral();
      socket.current.send(JSON.stringify({ type: "select", slot }));
    },
    [neutral],
  );

  useEffect(() => {
    let active = true;
    let reconnectSlot: number | undefined;
    let reconnectTimer: number | undefined;
    function connect(): void {
      const nextSocket = new WebSocket(socketUrl("player", room));
      socket.current = nextSocket;
      nextSocket.addEventListener("message", (event: MessageEvent<string>) => {
        const message = JSON.parse(event.data) as SessionMessage;
        if (message.type === "lobby") {
          setConnected(true);
          if (reconnectSlot !== undefined)
            nextSocket.send(JSON.stringify({ type: "select", slot: reconnectSlot }));
          else setStatus("Choose a player");
        }
        if (message.type === "joined") {
          currentSlot.current = message.slot;
          setSelectedSlot(message.slot);
          reconnectSlot = undefined;
          setStatus(`P${message.slot} connected`);
          transmit();
        }
        if (message.type === "slots") setTakenSlots(message.taken ?? []);
        if (message.type === "slot-taken") {
          reconnectSlot = undefined;
          setStatus(`Player ${message.slot} is taken`);
        }
      });
      nextSocket.addEventListener("close", (event: CloseEvent) => {
        if (!active) return;
        neutral();
        reconnectSlot = currentSlot.current;
        currentSlot.current = undefined;
        setSelectedSlot(undefined);
        setTakenSlots([]);
        setConnected(false);
        if (event.code === 1008 || event.code === 1000) {
          setStatus(
            event.code === 1008
              ? "Session full or unavailable · Scan again"
              : "Session ended · Scan again",
          );
          return;
        }
        setStatus("Reconnecting…");
        reconnectTimer = window.setTimeout(connect, 1500);
      });
    }
    connect();
    const heartbeat = window.setInterval(transmit, 150);
    return () => {
      active = false;
      window.clearInterval(heartbeat);
      window.clearTimeout(reconnectTimer);
      socket.current?.close();
    };
  }, [room, transmit, neutral]);

  return { input, selectedSlot, takenSlots, connected, status, select, update, neutral };
}
