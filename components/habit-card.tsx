"use client";

import { useState } from "react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api";
import { cn } from "@/lib/utils";
import { Edit, Trash } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Habit } from "@/types";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useUserPoints } from "@/hooks/use-user-points";

interface HabitCardProps {
    originalHabit: Habit;
    onDelete: (id: number) => void;
};

const HabitCard = ({
    originalHabit,
    onDelete,
}: HabitCardProps) => {
    const userPoints = useUserPoints();
    const [editedHabit, setEditedHabit] = useState<Habit>(originalHabit);
    const [editedName, setEditedName] = useState<string>(originalHabit.habit_name);
    const [editedPoints, setEditedPoints] = useState<number | undefined>(originalHabit.points);

    const onEdit = () => {
        if (!editedName || editedName === "") {
            toast.error("Name is required");
            return;
        }
        if (editedPoints === undefined) {
            toast.error("Enter an integer value for points");
            return;
        }
        if (editedPoints === 0) {
            toast.error("points cannot be 0");
            return;
        }
        const habit = JSON.stringify({id: editedHabit.id, habit_name: editedName, points: editedPoints});
        invoke("update_habit", {habit}).then((habits) => {
            setEditedHabit((habits as Habit[])[0]);
            toast.success("habit updated");
        }).catch(() => toast.error("failed to update"));
    };

    const onDone = (points: number) => {
        invoke("update_user_points", { points }).then((points) => {
            userPoints.setPoints(points as number);
            toast.success("Habit done!");
        }).catch(() => toast.error("Could not update points"));
    };

    return (
        <div className={cn("flex flex-col justify-between items-center w-[30%] h-40 rounded-lg text-black",
            editedHabit.points > 0 ? "bg-[#2cb51d]" : "bg-[#e61515]"
        )}>
            <h2 className="text-xl">{editedHabit.habit_name}</h2>
            <h2>{editedHabit.points < 0 ? `penalty: ${editedHabit.points}` : `reward: +${editedHabit.points}`}</h2>
            <Button 
                className={cn(editedHabit.points > 0 ? "bg-emerald-800 hover:bg-emerald-900" : "bg-rose-800 hover:bg-rose-900")}
                onClick={() => onDone(editedHabit.points)}
            >
                Done
            </Button>
            <div className="flex items-center justify-between m-2 w-full">
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <button 
                    className="w-[15%] h-7 rounded-lg hover:bg-rose-400 transition mx-2"
                >
                    <p className="flex items-center justify-center">
                        <Trash />
                    </p>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete your activity</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your activity.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction>
                            <Button 
                                type="submit"
                                onClick={() => onDelete(editedHabit.id)}
                            >
                                Delete
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog>
            <DialogTrigger asChild>
                <button 
                    className="w-[15%] h-7 rounded-lg hover:bg-slate-500 transition mx-2"
                >
                    <p className="flex items-center justify-center">
                        <Edit />
                    </p>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit your activity</DialogTitle>
                    <DialogDescription>
                        Write information here. Use negative integer for bad activities. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                defaultValue={editedName}
                                type="text"
                                placeholder="Enter the name of your activity"
                                className="col-span-3"
                                required
                                onChange={(e) => {
                                    if (e.target.value === "") {
                                        toast.error("name cannot be an empty string");
                                        setEditedName("");
                                        return;
                                    }
                                    setEditedName(e.target.value);
                                }}
                                />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Points
                            </Label>
                            <Input
                                id="points"
                                defaultValue={editedPoints}
                                type="number"
                                placeholder="Enter poistive or negative integer"
                                className="col-span-3"
                                onChange={(e) => {
                                    if (e.target.value === "") {
                                        toast.error("You should enter a value for points");
                                        setEditedPoints(undefined);
                                        return;
                                    }
                                    const numberOfPoints: number = Number(e.target.value);
                                    setEditedPoints(numberOfPoints);
                                }}
                                />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose>
                            <Button 
                                type="submit"
                                onClick={onEdit}
                            >
                                Save
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </div>
     );
}
 
export default HabitCard;