import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Toggle } from "./ui/toggle"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    function handleToggle() {
        if (theme == "light") {
            setTheme("dark")

        } else {
            setTheme("light")
        }
    }

    return (
        <Toggle
            aria-label="Toggle bookmark"
            size={"sm"}
            variant={"outline"}
            className="Toggle"
            onClick={() => { handleToggle() }}
        >

            <Sun className="data-[state=on]   h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 " />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Toggle>

    )
}