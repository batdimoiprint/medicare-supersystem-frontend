import { ModeToggle } from "@/components/mode-toggle"
import BlurText from '@/components/ui/BlurText'

export default function AdminPage() {
    return (
        <div>
            <ModeToggle />
            <BlurText text="Admin Page" delay={100} className="text-lg font-semibold" />
        </div>
    )
}