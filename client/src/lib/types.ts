export interface Player {
    id: string;
    name: string;
}

export interface Team {
    name: string;
    owner_id: string;
    players: Player[];
    max_size: number;
}

export interface Trade {
    timestamp: string;
    team1: string;
    team2: string;
    players1: Player[]; // Players sent BY team1
    players2: Player[]; // Players sent BY team2
}
