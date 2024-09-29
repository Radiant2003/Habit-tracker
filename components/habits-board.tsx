"use client";

import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Habit } from "@/types";
import HabitCard from "./habit-card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

const HabitsBoard = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabitName, setNewHabitName] = useState<string>("");
    const [newHabitPoints, setNewHabitPoints] = useState<number | undefined>(undefined);

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

    const getHabits = () => {
        invoke("get_habits").then(habits => {
            setHabits(habits as Habit[]);
        });
    };

    const onDelete = (id: number) => {
        invoke("delete_habit", { id }).then((habits) => {
            setHabits(habits as Habit[]);
            toast.success("habit deleted");
        }).catch(() => toast.error("failed to delete"));
    }

    useEffect(() => {
        getHabits();
    }, []);
    return ( 
        <div className="flex flex-wrap justify-evenly w-full h-full gap-x-2 gap-y-2 mb-3">
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
     );
}
 
export default HabitsBoard;