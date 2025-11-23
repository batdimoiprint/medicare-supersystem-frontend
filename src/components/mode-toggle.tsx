import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Toggle } from "./ui/toggle"
import * as React from "react"

type ModeToggleProps = React.ComponentProps<typeof Toggle>

export const ModeToggle = React.forwardRef<HTMLButtonElement, ModeToggleProps>(function ModeToggle(
    props,
    ref
) {
    const { theme, setTheme } = useTheme()

    function handleToggle() {
        if (theme === "light") setTheme("dark")
        else setTheme("light")
    }

    return (
        <Toggle
            {...props}
            ref={ref}
            aria-label={props["aria-label"] ?? "Toggle color theme"}
            size={props.size ?? "sm"}
            variant={props.variant ?? "outline"}
            className={props.className ?? "Toggle"}
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                handleToggle()
                if (props.onClick) props.onClick(e)
            }}
        >
            <Sun className="data-[state=on] h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle color theme</span>
        </Toggle>
    )
})

ModeToggle.displayName = "ModeToggle"