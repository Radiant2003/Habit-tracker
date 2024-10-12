"use client";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import Image from "next/image";

import { Progress } from "./ui/progress";

import { League, User } from "@/types";
import { useUserPoints } from "@/hooks/use-user-points";

const ProgressBanner = () => {
    const userPoints = useUserPoints();

    const [league, setLeague] = useState<League>({id: 1, league_name: "zhest", lower_bound: 0, league_cost: 0});
    const [upperBound, SetUpperBound] = useState<number>(499);

    useEffect(() => {
        invoke("create_or_get_user").then((users)=> {
            userPoints.setPoints((users as User[])[0].points);
        });
    }, []);

    useEffect(() => {
        invoke("update_league", { points: userPoints.points }).then(leagues => {
            setLeague((leagues as League[])[(leagues as League[]).length - 1]);
            SetUpperBound(league.lower_bound + 499);
        });

        const updateInterval = setInterval(() => {
            invoke("check_user_update").then((new_points) => {
                if ((new_points as number) !== userPoints.points) {
                    userPoints.setPoints(new_points as number);
                }
            }).catch((e) => console.log(`Failed to update points with cost: ${e}`));
        }, 5000);

        return () => {
            clearInterval(updateInterval);
        }
    }, [userPoints]);

    return ( 
        <div className="w-[90%] my-5 border-4 border-neutral-300 rounded-lg px-10 pt-10 max-w-[980px]">
            <h1 className="text-xl font-semibold">{`${league.league_name.toUpperCase()} (daily cost: ${league.league_cost} points)`}</h1>
            <div className="flex items-center justify-between">
                <div className="w-[80%]">
                    <Progress value={(userPoints.points - league.lower_bound) / 4.99}/>
                    <h2>{userPoints.points} / {upperBound}</h2>
                </div>
                <Image 
                    alt="League"
                    src={`/${league.league_name}.png`}
                    width={150}
                    height={150}
                    className="mb-10"
                />
            </div>
        </div>
     );
}
 
export default ProgressBanner;