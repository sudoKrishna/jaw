import { createNoise2D } from 'simplex-noise';
import Alea from "alea";
import type { BiomeType, PropType, Tile } from '@repo/shared';

export const  WORLD_SEED = 12345;
export const CHUNK_SIZE = 32;

const ELEVATION_SCALE = 0.05;
const MOISTURE_SCALE = 0.08;
const PROP_SCALE = 0.2;

const elevationNoise = createNoise2D(Alea(String(WORLD_SEED)));
const moistureNoise = createNoise2D(Alea(String(WORLD_SEED + 1)));
const propNoise = createNoise2D(Alea(String(WORLD_SEED + 2)));

export function getBiome(elevation : number, moisture : number) : BiomeType {
    if(elevation  < -0.2) return 'ocean';
    if(elevation > 0.4) return 'mountain';
    if(moisture > 0.1) return 'forest';
    return 'desert';
}

export function getProp(
    biome : BiomeType,
    propValue : number
): PropType | undefined {
    if(biome === 'ocean') return undefined;
    if(propValue < 0.4) return undefined;

    switch (biome) {
        case 'forest': return propValue > 0.7 ? 'tree' : 'rock';
        case 'mountain' : return 'rock';
        case 'desert':  return propValue > 0.8 ? 'cactus' : undefined;
        default : return undefined;
    }
}


export function generateTile(worldTileX : number, worldTileY : number) : Tile {
    const elevation = elevationNoise(
        worldTileX * ELEVATION_SCALE,
        worldTileY * ELEVATION_SCALE
    );

    const moisture = moistureNoise(
        worldTileX * MOISTURE_SCALE,
        worldTileY * MOISTURE_SCALE
    );

    const propValue = propNoise(
        worldTileX * PROP_SCALE,
        worldTileY * PROP_SCALE
    );

    const biome = getBiome(elevation, moisture);
    const prop = getProp(biome, propValue);

    return {biome, elevation, moisture, prop};
}
