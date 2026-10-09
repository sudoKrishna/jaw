import type { Chunk, Tile } from "@repo/shared";
import { generateTile, CHUNK_SIZE, WORLD_SEED  } from "./noise";

const chunkCache = new Map<string, Chunk>();
const MAX_CACHE_SIZE = 200;

function getChunkKey(chunkX : number, chunkY : number) : string {
    return `${chunkX},${chunkY}`;
}

export function generateChunk(chunkX: number, chunkY : number) : Chunk {
    const tiles : Chunk['tiles'] = [];

    for(let row = 0; row < CHUNK_SIZE; row++) {
        const rowTiles: Tile[] = [];
        for(let col = 0; col < CHUNK_SIZE; col++) {
            const worldTileX = chunkX * CHUNK_SIZE + col;
            const worldTileY = chunkY * CHUNK_SIZE + row;
            rowTiles.push(generateTile(worldTileX, worldTileY));
        }
        tiles.push(rowTiles);
    }

    return {
        chunkX,
        chunkY,
        tiles,
        seed :WORLD_SEED,
        generatedAt : Date.now(),
    };
}


export function getOrGenerateChunk(chunkX : number , chunkY : number) : Chunk {
    const key = getChunkKey(chunkX , chunkY);

    const cached = chunkCache.get(key);
    if(cached) {
        return cached;
    }

    const chunk = generateChunk(chunkX , chunkY);

    if(chunkCache.size >= MAX_CACHE_SIZE) {
        const firstKey = chunkCache.keys().next().value;
        if(firstKey !== undefined) {
            chunkCache.delete(firstKey);
        }
    }

    chunkCache.set(key, chunk);
    console.log(`[chunk] generated (${chunkX}, ${chunkY}) | Cache: ${chunkCache.size}/${MAX_CACHE_SIZE}`);

    return chunk;
}

export function getCacheSize() : number {
    return chunkCache.size;
}

export function clearCache() : void {
    chunkCache.clear();
    console.log('[chunk] cache cleared')
}