"use client";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Record } from "@/types";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

const HistoryChart = () => {
    const [records, setRecords] = useState<Record[]>([]);

    const getRecords = () => {
        invoke("get_records").then(records => {
            setRecords(records as Record[]);
        });
    };

    const resetRecords = () => {
        invoke("reset_records").then(() => {
            setRecords([]);
            toast.success("Records reset");
        }).catch((e) => toast.error(`Failed to reset records: ${e}`));
    };

    useEffect(() => {
        getRecords();
    }, [records]);

    const chartConfig = {
        points: {
          label: "Points",
        },
      } satisfies ChartConfig;

    const recordsWithColors = records.map(record => {
        return ({
            ...record,
            fill: record.points > 0 ? "#2cb51d" : "#e61515"
        });
    });

    return (
        records.length !== 0 ? (
            <>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={recordsWithColors}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="created_at"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 6)}
                        />
                        <ChartTooltip content={<ChartTooltipContent className="bg-neutral-900"/>}/>
                        <Bar dataKey="points" radius={4} />
                    </BarChart>
                </ChartContainer>
                <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="bg-rose-900 hover:bg-rose-950">Reset</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Reset history</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground">
                        This action cannot be undone. This will fully reset your history.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-900 hover:bg-rose-950">
                            <Button
                                className="bg-rose-900 hover:bg-rose-950" 
                                type="submit"
                                onClick={resetRecords}
                            >
                                Reset
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </>
        ) : (
            <div className="flex items-center justify-center">No records in history</div>
        )
     );
}
 
export default HistoryChart;