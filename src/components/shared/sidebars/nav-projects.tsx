"use client"

import React from "react"
import dentistRoutes from "@/routes/dentistRoutes"

import {
    Folder,
    Forward,
    MoreHorizontal,
    Trash2,
    type LucideIcon,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects() {
    const { isMobile } = useSidebar()

    const computedProjects = React.useMemo(() => {
        const root = dentistRoutes as unknown as React.ReactElement<{ path?: string; children?: React.ReactElement | React.ReactElement[] }>
        const basePath: string = root?.props?.path || "/dentist"
        const children = React.Children.toArray(root?.props?.children || []) as React.ReactElement[]
        const items: { name: string; url: string; icon: LucideIcon }[] = []
        children.forEach((route) => {
            const r = route as React.ReactElement<{ path?: string }>
            const p = r.props.path as string | undefined
            if (!p) return
            const top = p.split("/")[0]
            if (["logging", "my-schedule"].includes(top)) {
                const name = top.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
                items.push({ name, url: `${basePath}/${p}`, icon: Folder })
            }
        })
        return items
    }, [])

    const finalProjects = computedProjects

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {finalProjects.map((item: { name: string; url: string; icon: LucideIcon }) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                            <a href={item.url}>
                                <item.icon />
                                <span>{item.name}</span>
                            </a>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                    <MoreHorizontal />
                                    <span className="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                            >
                                <DropdownMenuItem>
                                    <Folder />
                                    <span>View Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Forward />
                                    <span>Share Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Trash2 />
                                    <span>Delete Project</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <MoreHorizontal />
                        <span>More</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}
