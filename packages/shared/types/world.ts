export type WorldEvent = 
| {
    id : string;
    type: "player_joined";
    playerId: string;
    timestamp : number;
}
| {
    id : string;
    type : "player_left";
    playerId : string;
    timestamp : number;
}
| {
    id : string;
    type : "ncp_interaction";
    playerId : string;
    npcId : string;
    timestamp : number;
}
| {
    id : string;
    type : "quest_update";
    playerId : string;
    questId : string;
    status : QuestStatus;
    timestamp : number;
}




export type NPC = {
    id : string;
    name : string;
    radius : number;
    x : number;
    y : number;
    dialogue? : string;
    questIds : string;
}

export type QuestStatus = | "available" | "active" | "completed" | "failed";



export type Quest = {
    id : string;
    title : string;
    description : string;
    status : QuestStatus;
    objective  : {
        description : string;
        target : number;
        progress : number;
    };
    reward? : {
        experience?: number;
        currency? : number;
    };
};

export type Chunk = {
    id : string;
    chunkX : number;
    chunkY : number;
    width : number;
    height : number;
    npcs : NPC[];
    quests : Quest[];
    events : WorldEvent[]
}
