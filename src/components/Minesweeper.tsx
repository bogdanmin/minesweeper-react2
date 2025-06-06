{/* 
  Minesweeper.tsx - MultiversX.com Homepage Vibe
  - Matches http://multiversx.com/ hero section: dark, glassy, bold, neon blue/cyan, Inter font.
  - Only Tailwind and Lucide React used.
*/}

import React, { useState, useEffect, useCallback } from "react";
import { Bomb, Flag, Smile, Frown, Timer, RefreshCw } from "lucide-react";

// --- Types ---
type Cell = {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacent: number;
};
type GameStatus = "playing" | "won" | "lost";

// --- Config ---
const DIFFICULTIES = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 16, cols: 16, mines: 40 },
  Expert: { rows: 16, cols: 30, mines: 99 },
};

// --- Board Logic ---
function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x,
      y,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  );
}
function placeMines(board: Cell[][], mines: number, initial: { x: number; y: number }) {
  const rows = board.length;
  const cols = board[0].length;
  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if ((x === initial.x && y === initial.y) || board[y][x].isMine) continue;
    board[y][x].isMine = true;
    placed++;
  }
  // Calculate adjacent mine counts
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x].isMine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && board[ny][nx].isMine) {
            count++;
          }
        }
      }
      board[y][x].adjacent = count;
    }
  }
  return board;
}
function revealCell(board: Cell[][], x: number, y: number): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const stack = [{ x, y }];
  const visited = new Set<string>();
  while (stack.length) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const cell = board[y][x];
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (cell.adjacent === 0 && !cell.isMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            stack.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
  return board;
}
function checkWin(board: Cell[][], mines: number): boolean {
  let revealed = 0;
  let total = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.isRevealed) revealed++;
      if (!cell.isMine) total++;
    }
  }
  return revealed === total;
}
function countFlags(board: Cell[][]): number {
  return board.flat().filter((c) => c.isFlagged).length;
}

// --- Main Component ---
export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTIES>("Beginner");
  const { rows, cols, mines } = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(rows, cols));
  const [status, setStatus] = useState<GameStatus>("playing");
  const [started, setStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard(rows, cols));
    setStatus("playing");
    setStarted(false);
    setTimer(0);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
  }, [rows, cols, intervalId]);

  // Change difficulty
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (started && status === "playing") {
      if (!intervalId) {
        const id = setInterval(() => setTimer((t) => t + 1), 1000);
        setIntervalId(id);
      }
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
    // eslint-disable-next-line
  }, [started, status]);

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (status !== "playing") return;
    let newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newBoard[y][x];
    if (cell.isFlagged || cell.isRevealed) return;
    if (!started) {
      // Place mines on first click
      newBoard = placeMines(newBoard, mines, { x, y });
      setStarted(true);
    }
    if (cell.isMine) {
      cell.isRevealed = true;
      setStatus("lost");
      setBoard(newBoard.map((row) =>
        row.map((c) => c.isMine ? { ...c, isRevealed: true } : c)
      ));
      return;
    }
    newBoard = revealCell(newBoard, x, y);
    if (checkWin(newBoard, mines)) {
      setStatus("won");
      setBoard(newBoard.map((row) =>
        row.map((c) => c.isMine ? { ...c, isFlagged: true } : c)
      ));
      return;
    }
    setBoard(newBoard);
  };

  // Handle right click (flag)
  const handleCellRightClick = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (status !== "playing" || !started) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newBoard[y][x];
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    setBoard(newBoard);
  };

  // --- MultiversX.com Homepage Vibe Styles ---
  // Background: deep dark, blue/cyan glow, animated gradient
  // Card: glassmorphism, strong blur, border, shadow, white text, neon blue/cyan accents
  // Font: Inter, bold, large
  // Buttons/Select: glassy, border, blue/cyan text, bold, rounded, hover effect

  // --- Tailwind class presets ---
  const bg = "min-h-screen w-full flex flex-col items-center justify-center bg-[#0B1120] relative overflow-x-hidden";
  const animatedGlow = "before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,rgba(10,47,255,0.25)_0%,rgba(0,240,255,0.10)_60%,transparent_100%)] before:blur-2xl before:opacity-80 before:pointer-events-none";
  const card = "relative z-10 w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_8px_40px_0_rgba(0,240,255,0.10)] px-8 py-10 md:py-14 md:px-14 flex flex-col items-center";
  const title = "text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2";
  const gradientText = "bg-gradient-to-r from-[#0A2FFF] via-[#4F8CFF] to-[#00F0FF] bg-clip-text text-transparent";
  const subtitle = "text-lg md:text-xl font-semibold text-white/70 mb-8";
  const controls = "flex flex-col md:flex-row md:items-center md:justify-between w-full gap-6 mb-8";
  const selectBox = "rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-lg font-bold text-[#00F0FF] shadow focus:outline-none focus:ring-2 focus:ring-[#0A2FFF] transition";
  const statBox = "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 shadow text-white font-mono text-xl";
  const restartBtn = "ml-2 p-2 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 transition shadow";
  const boardWrap = "inline-block border-4 border-white/20 rounded-2xl bg-white/5 shadow-2xl p-2";
  const cellBase = "w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg select-none transition-all duration-100";
  const cellRevealed = "bg-white/90 text-gray-900 shadow-inner";
  const cellMine = "bg-gradient-to-br from-[#FF3B3B] to-[#FFBABA] text-white";
  const cellFlagged = "bg-gradient-to-br from-[#FFD600] to-[#FFF7B2] text-yellow-800";
  const cellHidden = "bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20";
  const cellDisabled = "opacity-60 pointer-events-none";
  const cellNumberColors = [
    "",
    "text-[#0A2FFF]",
    "text-[#00BFAE]",
    "text-[#FF3B3B]",
    "text-[#7C3AED]",
    "text-[#FF6F00]",
    "text-[#00F0FF]",
    "text-[#FF00C8]",
    "text-black"
  ];

  // --- Font: Inter (inject if not present) ---
  useEffect(() => {
    if (!document.getElementById("inter-font")) {
      const link = document.createElement("link");
      link.id = "inter-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap";
      document.head.appendChild(link);
    }
    document.body.classList.add("font-sans");
  }, []);

  return (
    <div className={bg + " " + animatedGlow} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className={card}>
        <div className="flex flex-col items-center w-full">
          <div className={title + " " + gradientText + " flex items-center gap-4"}>
            <Bomb className="w-12 h-12 drop-shadow-lg text-[#0A2FFF]" />
            <span>Minesweeper</span>
          </div>
          <div className={subtitle}>
            <span className="text-white/80">A classic game, reimagined with the MultiversX Vibe</span>
          </div>
        </div>
        <div className={controls}>
          <div className="flex items-center gap-3">
            <label className="text-white/70 font-semibold mr-2">Difficulty:</label>
            <select
              className={selectBox}
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as keyof typeof DIFFICULTIES)}
              disabled={started}
            >
              {Object.keys(DIFFICULTIES).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-6">
            <div className={statBox + " border-cyan-400"}>
              <Flag className="w-7 h-7 text-[#FFD600] drop-shadow" />
              <span>{mines - countFlags(board)}</span>
            </div>
            <div className={statBox + " border-blue-400"}>
              <Timer className="w-7 h-7 text-[#00F0FF] drop-shadow" />
              <span>{timer}</span>
            </div>
            <button
              className={restartBtn}
              onClick={resetGame}
              title="Restart"
            >
              <RefreshCw className="w-7 h-7 text-[#0A2FFF]" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div
            className={boardWrap}
            style={{
              boxShadow: "0 8px 40px 0 rgba(0,240,255,0.10)",
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 2.5rem)`,
                gridTemplateRows: `repeat(${rows}, 2.5rem)`,
                gap: 6,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  let cellClass = cellBase;
                  if (cell.isRevealed) {
                    cellClass += " " + (cell.isMine ? cellMine : cellRevealed);
                  } else if (cell.isFlagged) {
                    cellClass += " " + cellFlagged;
                  } else {
                    cellClass += " " + cellHidden;
                  }
                  if (cell.isRevealed && cell.isMine) cellClass += " animate-pulse";
                  if (cell.isRevealed && !cell.isMine && cell.adjacent > 0) cellClass += " " + cellNumberColors[cell.adjacent];
                  if (status !== "playing" || cell.isRevealed) cellClass += " " + cellDisabled;

                  return (
                    <button
                      key={`${x},${y}`}
                      className={cellClass}
                      onClick={() => handleCellClick(x, y)}
                      onContextMenu={e => handleCellRightClick(e, x, y)}
                      disabled={cell.isRevealed || status !== "playing"}
                      tabIndex={0}
                    >
                      {cell.isRevealed ? (
                        cell.isMine ? (
                          <Bomb className="w-7 h-7" />
                        ) : cell.adjacent > 0 ? (
                          <span>{cell.adjacent}</span>
                        ) : null
                      ) : cell.isFlagged ? (
                        <Flag className="w-7 h-7 text-[#FFD600]" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-10">
            {status === "won" && (
              <div className="flex items-center gap-3 text-[#00F0FF] font-extrabold text-2xl drop-shadow">
                <Smile className="w-8 h-8" />
                You won! 🎉
              </div>
            )}
            {status === "lost" && (
              <div className="flex items-center gap-3 text-[#FF3B3B] font-extrabold text-2xl drop-shadow">
                <Frown className="w-8 h-8" />
                Game Over!
              </div>
            )}
          </div>
        </div>
        <div className="mt-12 text-center text-xs text-white/40">
          <span>
            Inspired by classic Minesweeper.<br />
            <a
              href="https://unsplash.com/photos/1506744038136-46273834b3fb"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Background photo by Sean Stratton on Unsplash
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
