"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type DatePickerProps = {
    id?: string
    label?: React.ReactNode
    value?: Date | undefined
    onChange?: (date?: Date) => void
    placeholder?: string
    className?: string
}

/**
 * Controlled DatePicker component suitable for use with react-hook-form Controller.
 * If `value` is provided the component is controlled and will call onChange(date) on selection.
 */
export function DatePicker({
    id,

    value,
    onChange,
    placeholder = 'Select date',
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (d?: Date) => {
        if (onChange) onChange(d)
        setOpen(false)
    }

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id={id}
                        className="w-full justify-between font-normal"
                    >
                        {value ? value.toLocaleDateString() : placeholder}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
