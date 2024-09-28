import { League } from "./types";

export const LEAGUES: {[key: string]: League} = {
    "zhest": {
        title: "zhest",
        lower_bound: 0,
        league_cost: 0,
    },
    "iron": {
        title: "iron",
        lower_bound: 500,
        league_cost: 20,
    },
    "steel": {
        title: "steel",
        lower_bound: 1000,
        league_cost: 40,
    },
    "bronze": {
        title: "bronze",
        lower_bound: 1500,
        league_cost: 60,
    },
    "silver": {
        title: "silver",
        lower_bound: 2000,
        league_cost: 80
    },
    "gold": {
        title: "gold",
        lower_bound: 2500,
        league_cost: 100,
    },
    "platinum": {
        title: "platinum",
        lower_bound: 3000,
        league_cost: 120,
    },
    "diamond": {
        title: "diamond",
        lower_bound: 3500,
        league_cost: 140,
    },
};