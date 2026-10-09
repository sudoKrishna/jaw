import type { Chunk, Tile, BiomeType, PropType } from "@repo/shared";


const TILE_SIZE  = 32;  
const CHUNK_SIZE = 32;   


const BIOME_COLORS: Record<BiomeType, string> = {
  ocean:    '#1a6eb5',
  forest:   '#2d5a27',
  desert:   '#c4a35a',
  mountain: '#6b6b6b',
};

const BIOME_BORDER_COLORS: Record<BiomeType, string> = {
  ocean:    '#155a9e',
  forest:   '#1e3d1a',
  desert:   '#a88840',
  mountain: '#555555',
};

// draw single line
function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  screenX: number,
  screenY: number,
): void {
 
  ctx.fillStyle = BIOME_COLORS[tile.biome];
  ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

  // Subtle border
  ctx.strokeStyle = BIOME_BORDER_COLORS[tile.biome];
  ctx.lineWidth = 0.5;
  ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}

// draw props 
function drawProp(
  ctx: CanvasRenderingContext2D,
  prop: PropType,
  screenX: number,
  screenY: number,
): void {
  const cx = screenX + TILE_SIZE / 2;   
  const cy = screenY + TILE_SIZE / 2;   
  switch (prop) {

    case 'tree': {
      // Trunk
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(cx - 3, cy + 4, 6, 8);

      // Leaves — 3 layered circles
      ctx.fillStyle = '#1B5E20';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(cx, cy - 7, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rock': {
      // Dark gray rock shape
      ctx.fillStyle = '#455A64';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'cactus': {
      // Main stem
      ctx.fillStyle = '#33691E';
      ctx.fillRect(cx - 3, cy - 8, 6, 16);

      // Left arm
      ctx.fillRect(cx - 9, cy - 4, 7, 4);
      ctx.fillRect(cx - 9, cy - 8, 4, 5);

      // Right arm
      ctx.fillRect(cx + 2, cy - 2, 7, 4);
      ctx.fillRect(cx + 5, cy - 6, 4, 5);
      break;
    }

    case 'water_lily': {
      // Water lily on ocean tiles
      ctx.fillStyle = '#1B5E20';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Small flower
      ctx.fillStyle = '#F8BBD0';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

 // draw single chunk

function drawChunk(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  cameraX: number,
  cameraY: number,
): void {
  // Chunk ka world pixel origin
  const chunkWorldX = chunk.chunkX * CHUNK_SIZE * TILE_SIZE;
  const chunkWorldY = chunk.chunkY * CHUNK_SIZE * TILE_SIZE;

  for (let row = 0; row < CHUNK_SIZE; row++) {
    for (let col = 0; col < CHUNK_SIZE; col++) {
      const tile = chunk.tiles[row][col];

      // World → Screen coordinates
      const screenX = chunkWorldX + col * TILE_SIZE - cameraX;
      const screenY = chunkWorldY + row * TILE_SIZE - cameraY;

      // Screen ke bahar hai? Skip karo
      if (
        screenX + TILE_SIZE < 0 ||
        screenY + TILE_SIZE < 0 ||
        screenX > ctx.canvas.width ||
        screenY > ctx.canvas.height
      ) {
        continue;
      }

      // Tile draw karo
      drawTile(ctx, tile, screenX, screenY);

      // Prop hai toh draw karo
      if (tile.prop) {
        drawProp(ctx, tile.prop, screenX, screenY);
      }
    }
  }
}

// draw all loaded chunks
export function drawChunks(
  ctx: CanvasRenderingContext2D,
  chunks: Map<string, Chunk>,
  cameraX: number,
  cameraY: number,
): void {
  for (const chunk of chunks.values()) {
    drawChunk(ctx, chunk, cameraX, cameraY);
  }
}



// main render har frame call karo

export function render(
  ctx: CanvasRenderingContext2D,
  chunks: Map<string, Chunk>,
  playerX: number,
  playerY: number,
  playerColor: string = '#FF5252',
): void {
  const canvas = ctx.canvas;

  // Camera  player ke center mein
  const cameraX = playerX - canvas.width  / 2;
  const cameraY = playerY - canvas.height / 2;

  // Canvas clear karo
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background — ocean color default
  ctx.fillStyle = '#0d47a1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Saare loaded chunks draw karo
  for (const chunk of chunks.values()) {
    drawChunk(ctx, chunk, cameraX, cameraY);
  }

  // Player draw karo  hamesha screen center pe
  const playerScreenX = canvas.width  / 2;
  const playerScreenY = canvas.height / 2;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerScreenX, playerScreenY + 10, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player body
  ctx.fillStyle = playerColor;
  ctx.beginPath();
  ctx.arc(playerScreenX, playerScreenY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Player border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// chunk border dekho

export function renderDebugChunkBorders(
  ctx: CanvasRenderingContext2D,
  chunks: Map<string, Chunk>,
  playerX: number,
  playerY: number,
): void {
  const cameraX = playerX - ctx.canvas.width  / 2;
  const cameraY = playerY - ctx.canvas.height / 2;

  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.font = '10px monospace';
  ctx.fillStyle = 'red';

  for (const chunk of chunks.values()) {
    const screenX = chunk.chunkX * CHUNK_SIZE * TILE_SIZE - cameraX;
    const screenY = chunk.chunkY * CHUNK_SIZE * TILE_SIZE - cameraY;
    const size    = CHUNK_SIZE * TILE_SIZE;

    ctx.strokeRect(screenX, screenY, size, size);
    ctx.fillText(`(${chunk.chunkX},${chunk.chunkY})`, screenX + 4, screenY + 14);
  }
}