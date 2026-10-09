
"use client";

import { useEffect, useRef } from "react";

type Player = {
  id: string;
  x: number;
  y: number;
};

type ServerMessage =
  | { type: "welcome"; playerId: string }
  | { type: "snapshot"; players: Player[] };

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SERVER_URL = "ws://localhost:8080";

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const player = {
      x: 0,
      y: 0,
      radius: 20,
      speed: 240,
    };

    const camera = {
      x: 0,
      y: 0,
      smoothing: 8,
    };

    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    // Multiplayer state
    let socket: WebSocket | null = null;
    let myPlayerId: string | null = null;
    let remotePlayers: Player[] = [];

    let reconnectTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    let stopped = false;
    let lastMoveSent = 0;

    const sendMove = () => {
      if (
        socket?.readyState !== WebSocket.OPEN ||
        !myPlayerId
      ) {
        return;
      }

      socket.send(
        JSON.stringify({
          type: "move",
          x: player.x,
          y: player.y,
        })
      );
    };

    const connect = () => {
      if (stopped) return;

      const ws = new WebSocket(SERVER_URL);
      socket = ws;

      ws.onopen = () => {
        console.log("Connected to game server");
      };

      ws.onmessage = (event) => {
        try {
          const message: unknown = JSON.parse(event.data);

          if (
            typeof message !== "object" ||
            message === null ||
            !("type" in message)
          ) {
            return;
          }

          if (
            message.type === "welcome" &&
            "playerId" in message &&
            typeof message.playerId === "string"
          ) {
            myPlayerId = message.playerId;

            console.log("My player ID:", myPlayerId);

            // Synchronize initial position immediately.
            sendMove();
            return;
          }

          if (
            message.type === "snapshot" &&
            "players" in message &&
            Array.isArray(message.players)
          ) {
            remotePlayers = message.players.filter(
              (p): p is Player =>
                typeof p === "object" &&
                p !== null &&
                "id" in p &&
                typeof p.id === "string" &&
                "x" in p &&
                typeof p.x === "number" &&
                Number.isFinite(p.x) &&
                "y" in p &&
                typeof p.y === "number" &&
                Number.isFinite(p.y)
            );
          }
        } catch {
          console.error("Invalid server message");
        }
      };

      ws.onclose = () => {
        if (socket === ws) {
          socket = null;
          myPlayerId = null;
        }

        console.log("Disconnected from game server");

        if (!stopped) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket connection error", error);
        ws.close();
      };
    };

    connect();

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key in keys) {
        event.preventDefault();
        keys[key as keyof typeof keys] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key in keys) {
        keys[key as keyof typeof keys] = false;
      }
    };

    const resetKeys = () => {
      keys.w = false;
      keys.a = false;
      keys.s = false;
      keys.d = false;
    };

    let animationId = 0;
    let previousTime = 0;
    let isRunning = true;

    const gameLoop = (currentTime: number) => {
      if (!isRunning) return;

      const deltaTime =
        previousTime === 0
          ? 0
          : Math.min((currentTime - previousTime) / 1000, 0.05);

      previousTime = currentTime;

      // 1. Read keyboard input
      let moveX = 0;
      let moveY = 0;

      if (keys.w) moveY -= 1;
      if (keys.s) moveY += 1;
      if (keys.a) moveX -= 1;
      if (keys.d) moveX += 1;

      // 2. Normalize diagonal movement
      const length = Math.hypot(moveX, moveY);

      if (length > 0) {
        moveX /= length;
        moveY /= length;
      }

      // 3. Update local player
      player.x += moveX * player.speed * deltaTime;
      player.y += moveY * player.speed * deltaTime;

      // 4. Send movement at approximately 20 updates/sec
      if (currentTime - lastMoveSent >= 50) {
        sendMove();
        lastMoveSent = currentTime;
      }

      // 5. Smooth camera follow
      const targetX = player.x - canvas.width / 2;
      const targetY = player.y - canvas.height / 2;

      const alpha = 1 - Math.exp(-camera.smoothing * deltaTime);

      camera.x += (targetX - camera.x) * alpha;
      camera.y += (targetY - camera.y) * alpha;

      // 6. Clear screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 7. Draw world using camera coordinates
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const gridSize = 50;

      const startX = Math.floor(camera.x / gridSize) * gridSize;
      const startY = Math.floor(camera.y / gridSize) * gridSize;
      const endX = camera.x + canvas.width + gridSize;
      const endY = camera.y + canvas.height + gridSize;

      ctx.beginPath();
      ctx.strokeStyle = "#292929";
      ctx.lineWidth = 1;

      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }

      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }

      ctx.stroke();

      // 8. Draw other players
      for (const other of remotePlayers) {
        if (other.id === myPlayerId) continue;

        ctx.beginPath();
        ctx.arc(other.x, other.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          other.id.slice(0, 8),
          other.x,
          other.y - 28
        );
      }

      // 9. Draw local player
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetKeys);
    window.addEventListener("resize", resizeCanvas);

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      stopped = true;
      isRunning = false;

      cancelAnimationFrame(animationId);
      clearTimeout(reconnectTimer);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetKeys);
      window.removeEventListener("resize", resizeCanvas);

      socket?.close();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: "#111111",
      }}
    />
  );
}