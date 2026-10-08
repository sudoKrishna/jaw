
"use client";

import { useEffect, useRef } from "react";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    // Player lives in world coordinates
    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 20,
      speed: 240,
    };

    // Camera position is the top-left of the visible world
    const camera = {
      x: player.x - canvas.width / 2,
      y: player.y - canvas.height / 2,
      smoothing: 8,
    };

    // Keyboard state
    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

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

      // 1. Read input
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

      // 3. Update player in world coordinates
      player.x += moveX * player.speed * deltaTime;
      player.y += moveY * player.speed * deltaTime;

      // 4. Calculate camera target
      const targetX = player.x - canvas.width / 2;
      const targetY = player.y - canvas.height / 2;

      // 5. Smooth camera follow (frame-rate independent)
      const alpha = 1 - Math.exp(-camera.smoothing * deltaTime);

      camera.x += (targetX - camera.x) * alpha;
      camera.y += (targetY - camera.y) * alpha;

      // 6. Clear screen in screen coordinates
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 7. Draw the world relative to the camera
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // World grid helps visualize camera movement
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

      // Draw player in world coordinates
      ctx.beginPath();
      ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Restore normal screen coordinates
      ctx.restore();

      // 8. Schedule next frame
      animationId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetKeys);
    window.addEventListener("resize", resizeCanvas);

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationId);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetKeys);
      window.removeEventListener("resize", resizeCanvas);
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