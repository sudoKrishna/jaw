import type { Chunk } from "@repo/shared";

const TILE_SIZE     = 32;
const CHUNK_SIZE    = 32;
const VIEW_DISTANCE = 1;   // 1 = 3x3 grid around player
const MAX_CHUNKS    = 200;



const loadedChunks    = new Map<string, Chunk>();
const requestedChunks = new Set<string>();


function getKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}


// pixel to chunk coordinate

export function pixelsToChunkCoords(pixelX: number, pixelY: number) {
  const tileX  = Math.floor(pixelX / TILE_SIZE);
  const tileY  = Math.floor(pixelY / TILE_SIZE);
  const chunkX = Math.floor(tileX  / CHUNK_SIZE);
  const chunkY = Math.floor(tileY  / CHUNK_SIZE);
  return { chunkX, chunkY };
}

// required chunks player ke around 3x3

function getRequiredChunkCoords(playerChunkX: number, playerChunkY: number) {
  const coords = [];

  for (let dy = -VIEW_DISTANCE; dy <= VIEW_DISTANCE; dy++) {
    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      coords.push({
        chunkX: playerChunkX + dx,
        chunkY: playerChunkY + dy,
      });
    }
  }

  return coords;
}



// update player move kare toh call karo

export function updateChunks(
  playerPixelX: number,
  playerPixelY: number,
  onRequest: (chunkX: number, chunkY: number) => void
): void {
  const { chunkX, chunkY } = pixelsToChunkCoords(playerPixelX, playerPixelY);
  const required = getRequiredChunkCoords(chunkX, chunkY);

  for (const coord of required) {
    const key = getKey(coord.chunkX, coord.chunkY);

    if (loadedChunks.has(key))    continue;  // already hai
    if (requestedChunks.has(key)) continue;  // already maanga

    requestedChunks.add(key);
    onRequest(coord.chunkX, coord.chunkY);
  }
}


// server se chunk aaya

export function receiveChunk(
  chunk: Chunk,
  onLoaded?: (chunk: Chunk) => void
): void {
  const key = getKey(chunk.chunkX, chunk.chunkY);

  
  if (loadedChunks.size >= MAX_CHUNKS) {
    const oldestKey = loadedChunks.keys().next().value;
    if (oldestKey !== undefined) {
      loadedChunks.delete(oldestKey);
    }
  }

  loadedChunks.set(key, chunk);
  requestedChunks.delete(key);

  console.log(`[ChunkManager] Loaded (${chunk.chunkX}, ${chunk.chunkY}) | Total: ${loadedChunks.size}`);

  onLoaded?.(chunk);
}



// getter rendered use karna hai

export function getChunk(chunkX: number, chunkY: number): Chunk | undefined {
  return loadedChunks.get(getKey(chunkX, chunkY));
}

export function getAllLoadedChunks(): Map<string, Chunk> {
  return loadedChunks;
}

export function getChunkStats() {
  return {
    loaded:  loadedChunks.size,
    pending: requestedChunks.size,
  };
}