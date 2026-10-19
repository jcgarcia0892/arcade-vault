"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import type { Game } from "@/lib/games";
import { saveScore, useUser } from "@/lib/session";

interface PlayState {
  score: number;
  lives: number;
  level: number;
  paused: boolean;
  over: boolean;
}

type PlayAction =
  | { type: "tick"; points: number }
  | { type: "togglePause" }
  | { type: "end" }
  | { type: "restart" };

const INITIAL: PlayState = { score: 0, lives: 3, level: 1, paused: false, over: false };

function play(state: PlayState, action: PlayAction): PlayState {
  switch (action.type) {
    case "tick": {
      const score = state.score + action.points;
      // Same rule as the template: level up each time the score lands just past a multiple of 2500.
      const level = score > 0 && score % 2500 < 100 ? state.level + 1 : state.level;
      return { ...state, score, level };
    }
    case "togglePause":
      return { ...state, paused: !state.paused };
    case "end":
      return { ...state, over: true };
    case "restart":
      return INITIAL;
  }
}

export function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useUser();
  const [{ score, lives, level, paused, over }, dispatch] = useReducer(play, INITIAL);
  // null until the player types, so the name follows the session once it hydrates.
  const [typedName, setTypedName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const name = typedName ?? user?.name ?? "INVITADO";

  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(() => dispatch({ type: "tick", points: Math.floor(10 + Math.random() * 90) }), 220);
    return () => clearInterval(t);
  }, [over, paused]);

  const restart = () => {
    dispatch({ type: "restart" });
    setSaved(false);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="flex flex-wrap gap-6">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v text-ink">{name}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => dispatch({ type: "togglePause" })}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={() => dispatch({ type: "end" })}>
            FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/juegos/${game.id}`)}>
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content z-5 bg-black/60">
              <div>
                <div className="pixel neon-yellow text-[22px]">EN PAUSA</div>
                <div className="mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setTypedName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={() => {
                    saveScore({ game: game.id, score, name });
                    setSaved(true);
                  }}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/juegos")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
