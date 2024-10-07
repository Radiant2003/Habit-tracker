"use client";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LucideBookOpenText, Plus } from "lucide-react";

import { Habit } from "@/types";
import HabitCard from "./habit-card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import HistoryChart from "./history-chart";

const HabitsBoard = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabitName, setNewHabitName] = useState<string>("");
    const [newHabitPoints, setNewHabitPoints] = useState<number | undefined>(undefined);

    const [filterCalback, setFilterCallback] = useState<(habit: Habit) => boolean>();
    const [sortCallback, setSortCallback] = useState<(a: Habit, b: Habit) => number>();

    const onCreate = () => {
        if (!newHabitName || newHabitName === "") {
            toast.error("Name is required");
            return;
        }
        if (newHabitPoints === undefined) {
            toast.error("Enter an integer value for points");
            return;
        }
        if (newHabitPoints === 0) {
            toast.error("points cannot be 0");
            return;
        }
        const habit = JSON.stringify({id: 1, habit_name: newHabitName, points: newHabitPoints});
        invoke("create_habit", {habit}).then((habits) => {
            setHabits(habits as Habit[]);
            toast.success("habit created");
        }).catch(() => toast.error("failed to create"));
    };

    const getHabits = (filter: ((habit: Habit) => boolean) | undefined, sort:((a: Habit, b: Habit) => number) | undefined) => {
        invoke("get_habits").then(habits => {
            if (filter && sort) {
                const filtered = (habits as Habit[]).filter((habit) => filter(habit));
                setHabits(filtered.sort((a, b) => sort(a, b)));
            }
            else if (filter) {
                setHabits((habits as Habit[]).filter((habit) => filter(habit)));
            }
            else if (sort) {
                setHabits((habits as Habit[]).sort((a, b) => sort(a, b)));
            }
            else {
                setHabits(habits as Habit[]);
            }
        });
    };

    const onDelete = (id: number) => {
        invoke("delete_habit", { id }).then((habits) => {
            setHabits(habits as Habit[]);
            toast.success("habit deleted");
        }).catch(() => toast.error("failed to delete"));
    };

    const onSelectSort = (value: string) => {
        if (value === "lowest_points") {
            const sortFunc = () => (a: Habit, b: Habit) => a.points - b.points;
            setSortCallback(sortFunc);
            getHabits(filterCalback, sortCallback);
            return;
        }
        const sortFunc = () => (a: Habit, b: Habit) => b.points - a.points;
        setSortCallback(sortFunc);
        getHabits(filterCalback, sortCallback);
    };

    const onSelectFilter = (value: string) => {
        if (value === "positive") {
            const filterFunc = () => (habit: Habit) => habit.points > 0;
            setFilterCallback(filterFunc);
            getHabits(filterCalback, sortCallback);
            return;
        }
        else if (value === "negative") {
            const filterFunc = () => (habit: Habit) => habit.points < 0;
            setFilterCallback(filterFunc);
            getHabits(filterCalback, sortCallback);
            return;
        }
        setFilterCallback(() => () => true);
        getHabits(filterCalback, sortCallback);
    };

    useEffect(() => {
        getHabits(filterCalback, sortCallback);
    }, [filterCalback, sortCallback]);
    return (
        <>
            <div className="w-full flex gap-x-2 mb-2 justify-center">
                <div className="flex w-[90%] max-w-[980px] justify-start gap-x-2">
                <Select onValueChange={(value) => onSelectSort(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] text-foreground border-0">
                        <SelectGroup>
                            <SelectLabel>Sort by</SelectLabel>
                            <SelectItem value="lowest_points">Lowest points</SelectItem>
                            <SelectItem value="largest_points">Largest points</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select onValueChange={(value) => onSelectFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] text-foreground border-0">
                        <SelectGroup>
                            <SelectLabel>Show only</SelectLabel>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Dialog>
                    <DialogTrigger>
                        <Button className="bg-foreground border">
                            <LucideBookOpenText className="mr-1"/>History
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[70%] min-w-[425px]">
                        <HistoryChart />
                    </DialogContent>
                </Dialog>
                </div>
            </div>
            <div className="flex flex-wrap justify-evenly w-full h-full gap-x-2 gap-y-2 mb-3 max-w-[1200px]">
                {habits.map(habit => (
                    <HabitCard key={habit.id} originalHabit={habit} onDelete={onDelete}/>
                ))}
                <Dialog>
                    <DialogTrigger asChild>
                        <button 
                            className="w-[30%] h-[27vh] border-2 rounded-lg hover:bg-slate-700 transition border-neutral-300 max-w-[350px] min-h-[150px]"
                >
                            <p className="flex items-center justify-center">
                                <Plus />Add activity
                            </p>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add your activity</DialogTitle>
                            <DialogDescription className="text-foreground">
                                Write information here. Use negative integer for bad activities. Click add when you&apos;re done.
                            </DialogDescription>
                        </DialogHeader>
                            <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                            id="name"
                            defaultValue={newHabitName}
                            type="text"
                            placeholder="Enter the name of your activity"
                            className="col-span-3"
                            required
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    toast.error("name cannot be an empty string");
                                    setNewHabitName("");
                                    return;
                                }
                                setNewHabitName(e.target.value);
                            }}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Points
                            </Label>
                            <Input
                            id="points"
                            defaultValue={newHabitPoints}
                            type="number"
                            placeholder="Enter poistive or negative integer"
                            className="col-span-3"
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    toast.error("You should enter a value for points");
                                    setNewHabitPoints(undefined);
                                    return;
                                }
                                const numberOfPoints: number = Number(e.target.value);
                                setNewHabitPoints(numberOfPoints);
                            }}
                            />
                        </div>
                        </div>
                        <DialogFooter>
                            <DialogClose>
                                <Button 
                                    type="submit"
                                    onClick={onCreate}
                                >
                                    Add
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
            </div>
        </> 
     );
}
 
export default HabitsBoard;