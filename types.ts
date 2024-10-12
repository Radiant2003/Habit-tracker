export type User = {
    id:number;
    points: number;
    updated_at: number;
    league_id: number;
};

export type Habit = {
    id: number,
    habit_name: string,
    points: number,
};

export type League = {
    id: number;
    league_name: string;
    lower_bound: number;
    league_cost: number;
};

export type Record = {
    id: number;
    points: number;
    created_at: string;
};