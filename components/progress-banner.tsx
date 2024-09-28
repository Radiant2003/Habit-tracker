"use client";

import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import Image from "next/image";

import { Progress } from "./ui/progress";

import { LEAGUES } from "@/constants";
import { League, User } from "@/types";
import { useUserPoints } from "@/hooks/use-user-points";

const ProgressBanner = () => {
    const userPoints = useUserPoints();

    const [league, setLeague] = useState<League>({title: "zhest", lower_bound: 0, league_cost: 0});
    const [upperBound, SetUpperBound] = useState<number>(499);

    useEffect(() => {
        invoke("create_or_get_user").then((users)=> {
            userPoints.setPoints((users as User[])[0].points);
        });
    });

    useEffect(() => {
        for (const key of Object.keys(LEAGUES)) {
            if (userPoints.points >= LEAGUES[key].lower_bound) {
                setLeague(LEAGUES[key]);
                SetUpperBound(league.lower_bound + 499);
            }
            else {
                break;
            }
        }

        const updateInterval = setInterval(() => {
            const leagueEntryPoints: number = league.league_cost;
            invoke("check_user_update", { leagueEntryPoints }).then((new_points) => {
                if ((new_points as number) !== userPoints.points) {
                    userPoints.setPoints(new_points as number);
                }
            }).catch((e) => console.log(`Failed to update points with cost: ${e}`));
        }, 5000);

        return () => {
            clearInterval(updateInterval);
        }
    }, [userPoints, league]);

    return ( 
        <div className="w-[90%] my-5 border-4 border-neutral-300 rounded-lg px-10 pt-10">
            <h1 className="text-xl font-semibold">{league.title.toUpperCase()}</h1>
            <div className="flex items-center justify-between">
                <div className="w-[80%]">
                    <Progress value={(userPoints.points - league.lower_bound) / 4.99}/>
                    <h2>{userPoints.points} / {upperBound}</h2>
                </div>
                <Image 
                    alt="League"
                    src={`/${league.title}.png`}
                    width={150}
                    height={150}
                    className="mb-10"
                />
            </div>
        </div>
     );
}
 
export default ProgressBanner;