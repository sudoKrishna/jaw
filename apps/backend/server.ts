import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";



type Player = {
  id: string;
  x: number;
  y: number;
};

type ClientMessage =
  | { type: "join" }
  | { type: "move"; x: number; y: number };

type ServerMessage = {
  type: "snapshot";
  players: Player[];
};


const PORT = 8080;
const TICK_RATE = 20;
const HEARTBEAT_INTERVAL = 30_000;

const wss = new WebSocketServer({ port: PORT });

// Each socket is associated with its player's state.
const players = new Map<WebSocket, Player>();

// Tracks whether a client responded to the last ping.
const aliveClients = new Set<WebSocket>();

console.log(`WebSocket server running on port ${PORT}`);

// Message Validation 

function parseClientMessage(data: Buffer): ClientMessage | null {
  let message: unknown;

  try {
    message = JSON.parse(data.toString());
  } catch {
    return null;
  }

  if (
    typeof message !== "object" ||
    message === null ||
    !("type" in message)
  ) {
    return null;
  }

  if (message.type === "join") {
    return { type: "join" };
  }

  if (
    message.type === "move" &&
    "x" in message &&
    "y" in message &&
    typeof message.x === "number" &&
    typeof message.y === "number" &&
    Number.isFinite(message.x) &&
    Number.isFinite(message.y)
  ) {
    return {
      type: "move",
      x: message.x,
      y: message.y,
    };
  }

  return null;
}

// Broadcast

function broadcastSnapshot() {
  const response: ServerMessage = {
    type: "snapshot",
    players: Array.from(players.values()),
  };

  const payload = JSON.stringify(response);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

//  Connection Handling

wss.on("connection", (ws) => {
  const player: Player = {
    id: randomUUID(),
    x: 0,
    y: 0,
  };

  players.set(ws, player);
  aliveClients.add(ws);

  ws.send(
  JSON.stringify({
    type: "welcome",
    playerId: player.id,
  })
);

  console.log("Player connected:", player.id);
  console.log("Players online:", players.size);

  // ws automatically responds to protocol-level ping frames.
  ws.on("pong", () => {
    aliveClients.add(ws);
  });

  ws.on("message", (data, isBinary) => {
    
    if (isBinary) {
      console.warn("Binary messages are not supported");
      return;
    }

    const message = parseClientMessage(data as Buffer);

    if (!message) {
      console.warn("Invalid client message");
      return;
    }

    const currentPlayer = players.get(ws);

    if (!currentPlayer) {
      return;
    }

    switch (message.type) {
      case "join": {
        console.log("Player joined:", currentPlayer.id);
        break;
      }

      case "move": {
        // Basic bounds validation. Adjust to your world size.
        const MAX_COORDINATE = 100_000;

        if (
          Math.abs(message.x) > MAX_COORDINATE ||
          Math.abs(message.y) > MAX_COORDINATE
        ) {
          console.warn("Movement out of bounds:", currentPlayer.id);
          return;
        }

        currentPlayer.x = message.x;
        currentPlayer.y = message.y;
        break;
      }
    }
  });

  ws.on("close", () => {
    const disconnectedPlayer = players.get(ws);

    players.delete(ws);
    aliveClients.delete(ws);

    console.log("Player disconnected:", disconnectedPlayer?.id);
    console.log("Players online:", players.size);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

// Game Tick

const tickTimer = setInterval(() => {
  broadcastSnapshot();
}, 1000 / TICK_RATE);

// Heartbear

const heartbeatTimer = setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }

    if (!aliveClients.has(client)) {
      // No pong received since the previous heartbeat.
      client.terminate();
      continue;
    }

    aliveClients.delete(client);
    client.ping();
  }
}, HEARTBEAT_INTERVAL);

// Graceful Shutdown

function shutdown() {
  console.log("Shutting down WebSocket server...");

  clearInterval(tickTimer);
  clearInterval(heartbeatTimer);

  for (const client of wss.clients) {
    client.terminate();
  }

  wss.close(() => {
    console.log("WebSocket server stopped");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);