"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    minDate?: Date
    maxDate?: Date
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
    minDate,
    maxDate,
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                    {format(date.to, "LLL dd, y", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale: es })
                            )
                        ) : (
                            <span>Seleccionar fechas</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        disabled={(date) => {
                            const isBeforeMin = minDate ? date < minDate : false;
                            const isAfterMax = maxDate ? date > maxDate : false;
                            return isBeforeMin || isAfterMax;
                        }}
                        defaultMonth={date?.from || minDate}
                    />
                    <div className="p-3 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-foreground"
                            onClick={() => setDate(undefined)}
                        >
                            Limpiar Filtro
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
