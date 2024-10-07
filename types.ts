export type User = {
    id:number;
    points: number;
    updated_at: number;
};

export type Habit = {
    id: number,
    habit_name: string,
    points: number,
};

export type League = {
    title: string;
    lower_bound: number;
    league_cost: number;
};

export type Record = {
    id: number;
    points: number;
    created_at: string;
};