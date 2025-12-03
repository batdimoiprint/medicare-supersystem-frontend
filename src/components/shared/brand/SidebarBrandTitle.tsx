"use client"

import { useSidebar } from '@/components/ui/sidebar'
import Logo from '../Logo'
import { Label } from '@/components/ui/label'

export default function SidebarBrandTitle() {
    const { state } = useSidebar()
    const isCollapsed = state === 'collapsed'

    return (
        <div className='flex flex-row justify-center gap-4 py-4 cursor-pointer h-fill w-fill'>
            <Logo />
            {!isCollapsed && (
                <Label className='text-xl font-bold cursor-pointer text-foreground'>Medicare</Label>
            )}
        </div>
    )
}
