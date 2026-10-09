export type BiomeType = 'ocean' | 'forest' | 'desert' | 'mountain';
export type PropType  = 'tree' | 'rock' | 'cactus' | 'water_lily';
export const CHUNK_SIZE = 32 as const;

export interface Tile {
  biome: BiomeType;
  elevation: number;
  moisture: number;
  prop?: PropType;
}


export type WorldEvent =
  | { id: string; type: 'player_joined';    playerId: string; timestamp: number }
  | { id: string; type: 'player_left';      playerId: string; timestamp: number }
  | { id: string; type: 'ncp_interaction';  playerId: string; npcId: string; timestamp: number }
  | { id: string; type: 'quest_update';     playerId: string; questId: string; status: QuestStatus; timestamp: number }
  | { id: string; type: 'chunk_request';    playerId: string; chunkX: number; chunkY: number; timestamp: number }
  | { id: string; type: 'chunk_response';   chunkX: number; chunkY: number; chunk: Chunk; timestamp: number };

export type NPC = {
  id: string;
  name: string;
  radius: number;
  x: number;
  y: number;
  dialogue?: string;
  questIds: string[];   
};

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export type Quest = {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objective: {
    description: string;
    target: number;
    progress: number;
  };
  reward?: {
    experience?: number;
    currency?: number;
  };
};

export type Chunk = {
  chunkX: number;
  chunkY: number;
  tiles: Tile[][];        
  seed: number;
  generatedAt: number;
};