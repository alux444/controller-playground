import { useEffect, useRef, useState, type ReactElement } from "react";
import QRCode from "qrcode";
import { neutralState, type ControllerState } from "../server/protocol.ts";
import { socketUrl } from "./dom.ts";

interface Player {
  id: string;
  slot: number;
  state: ControllerState;
  lastInput: number;
}

interface HostMessage {
  type: string;
  token?: string;
  id?: string;
  slot?: number;
  state?: ControllerState;
}

function useHostSession(): { players: Player[]; join: string; status: string } {
  const [players, setPlayers] = useState<Player[]>([]);
  const [join, setJoin] = useState("");
  const [status, setStatus] = useState("Starting session");

  useEffect(() => {
    const socket = new WebSocket(socketUrl("host"));
    let active = true;
    socket.addEventListener("message", async (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as HostMessage;
      if (message.type === "room" && message.token) {
        try {
          const config = (await fetch("/api/config").then((response) =>
            response.json(),
          )) as { publicUrl: string };
          if (!active) return;
          const url = new URL(config.publicUrl);
          url.searchParams.set("join", message.token);
          setJoin(url.toString());
          setStatus("Session active");
        } catch {
          if (active) setStatus("Could not prepare link · Refresh to retry");
        }
      }
      if (message.type === "joined" && message.id && message.slot) {
        const player: Player = {
          id: message.id,
          slot: message.slot,
          state: { ...neutralState },
          lastInput: Date.now(),
        };
        setPlayers((previous) =>
          [...previous.filter((item) => item.id !== player.id), player].sort(
            (left, right) => left.slot - right.slot,
          ),
        );
      }
      if (message.type === "input" && message.id && message.state) {
        const nextState = message.state;
        setPlayers((previous) =>
          previous.map((player) =>
            player.id === message.id
              ? { ...player, state: nextState, lastInput: Date.now() }
              : player,
          ),
        );
      }
      if (message.type === "left")
        setPlayers((previous) => previous.filter((player) => player.id !== message.id));
    });
    socket.addEventListener("close", () => {
      if (active) setStatus("Session closed · Refresh to retry");
    });
    const timer = window.setInterval(
      () =>
        setPlayers((previous) =>
          previous.map((player) =>
            Date.now() - player.lastInput >= 1800 && player.lastInput !== 0
              ? {
                  ...player,
                  state: { ...neutralState, mode: player.state.mode },
                  lastInput: 0,
                }
              : player,
          ),
        ),
      500,
    );
    return () => {
      active = false;
      window.clearInterval(timer);
      socket.close();
    };
  }, []);
  return { players, join, status };
}

function Pairing({ join }: { join: string }): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!join || !canvas.current) return;
    void QRCode.toCanvas(canvas.current, join, {
      width: 192,
      margin: 1,
      color: { dark: "#1a201b", light: "#f4f3e9" },
    });
  }, [join]);
  return (
    <aside className="pairing">
      <div className="pairing-top">Connect a phone</div>
      <div className="qr-frame">
        <canvas ref={canvas} aria-label="QR code for joining this session" />
      </div>
      <p>Scan with your phone’s camera.</p>
      <div className="pairing-link">
        <span>Or open this link</span>
        {join ? <a href={join}>{join}</a> : "Preparing link…"}
        {join.startsWith("http:") && (
          <p className="notice">
            Phone motion needs HTTPS. Touch controls work on the local network.
          </p>
        )}
      </div>
    </aside>
  );
}

function PlayerCard({ player }: { player: Player }): ReactElement {
  const { state, slot, lastInput } = player;
  const aim = state.mode === "motion-pointer";
  const x = aim ? state.aimX : state.x;
  const y = aim ? state.aimY : state.y;
  const label =
    state.mode === "wheel"
      ? `Wheel · ${Math.round(state.x * 100)}%`
      : state.mode === "twin-stick"
        ? "Twin sticks"
        : aim
          ? "Motion pointer"
          : `Stick · ${Math.round(state.x * 100)} / ${Math.round(state.y * 100)}`;
  return (
    <article
      className={`player ${state.mode !== "wheel" ? "is-gamepad" : ""} ${state.mode === "twin-stick" ? "is-twin-stick" : ""}`}
    >
      <div className="player-top">
        <span>PLAYER {String(slot).padStart(2, "0")}</span>
        <span className="player-status">
          ● {lastInput ? "Connected" : "Input paused"}
        </span>
      </div>
      <div className="display">
        <div className="crosshair" />
        <div className="wheel-visual" style={{ transform: `rotate(${state.x * 90}deg)` }}>
          <span />
          <span />
          <span />
          <b>✳</b>
        </div>
        <div
          className="marker"
          style={{ transform: `translate(${x * 65}px, ${y * 65}px)` }}
        />
      </div>
      <div className="player-bottom">
        <div>
          <span className="label">Controller</span>
          <strong className="values">{lastInput ? label : "Waiting for input"}</strong>
        </div>
        <div className="button-indicators">
          <span className={`indicator primary ${state.primary ? "active" : ""}`}>A</span>
          <span className={`indicator secondary ${state.secondary ? "active" : ""}`}>
            B
          </span>
        </div>
      </div>
    </article>
  );
}

function AimStage({ players }: { players: Player[] }): ReactElement | null {
  const aiming = players.filter(
    ({ state, lastInput }) =>
      lastInput !== 0 && (state.mode === "twin-stick" || state.mode === "motion-pointer"),
  );
  if (!aiming.length) return null;
  return (
    <section className="aim-panel" aria-label="Shared aiming preview">
      <div className="aim-heading">
        <h3>Aim together</h3>
        <p>Each player has their own crosshair</p>
      </div>
      <div className="aim-field">
        {aiming.map(({ id, slot, state }) => (
          <div
            key={id}
            className={`aim-marker player-colour-${slot} ${state.primary ? "firing" : ""}`}
            aria-label={`Player ${slot} crosshair`}
            style={{ left: `${50 + 45 * state.aimX}%`, top: `${50 + 45 * state.aimY}%` }}
          >
            <span>{slot}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HostView(): ReactElement {
  const { players, join, status } = useHostSession();
  return (
    <main className="host-shell">
      <header className="topbar">
        <a className="wordmark" href="/">
          Controller playground
        </a>
        <span className="tag">
          <i /> A shared-screen experiment
        </span>
      </header>
      <section className="host-intro">
        <div>
          <h1>Controller playground</h1>
          <p className="intro-copy">Connect a phone and try the controls.</p>
        </div>
        <div className="corner-note">
          <strong>
            {players.length}
            <span> / 2</span>
          </strong>
          <p>phones connected</p>
        </div>
      </section>
      <section className="console" aria-label="Controller monitor">
        <div className="console-header">
          <div>
            <h2>Live input</h2>
            <p className="panel-hint">Inputs from connected phones.</p>
          </div>
          <span className="status">
            <i /> {status}
          </span>
        </div>
        <div className="console-content">
          <div className="monitor">
            <AimStage players={players} />
            <div className="player-grid">
              {players.length ? (
                players.map((player) => <PlayerCard key={player.id} player={player} />)
              ) : (
                <div className="empty">
                  <div className="empty-icon">⌁</div>
                  <h3>No phones connected</h3>
                  <p>Scan the code to join this session.</p>
                </div>
              )}
            </div>
          </div>
          <Pairing join={join} />
        </div>
        <div className="console-footer">
          <span>Keep this page open</span>
          <span>Up to two phones</span>
        </div>
      </section>
    </main>
  );
}
