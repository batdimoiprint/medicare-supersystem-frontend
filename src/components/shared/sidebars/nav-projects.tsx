"use client"

import React from "react"
import { useLocation } from "react-router-dom"
import { dentistRouteData } from "@/routes/dentistRoutes"
import { adminRouteData } from "@/routes/adminRoutes"
import { cashierRouteData } from "@/routes/cashierRoutes"
import { inventoryRouteData } from "@/routes/inventoryRoutes"
import { patientRouteData } from "@/routes/patientRoutes"
import { receptionistRouteData } from "@/routes/receptionistRoutes"

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
    // SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects() {
    const { isMobile } = useSidebar()
    const location = useLocation()

    const computedProjects = React.useMemo(() => {
        let basePath = "/dentist"
        let children: any[] = dentistRouteData

        if (location.pathname.startsWith("/admin")) {
            basePath = "/admin"
            children = adminRouteData
        } else if (location.pathname.startsWith("/cashier")) {
            basePath = "/cashier"
            children = cashierRouteData
        } else if (location.pathname.startsWith("/inventory")) {
            basePath = "/inventory"
            children = inventoryRouteData
        } else if (location.pathname.startsWith("/patient")) {
            basePath = "/patient"
            children = patientRouteData
        } else if (location.pathname.startsWith("/receptionist")) {
            basePath = "/receptionist"
            children = receptionistRouteData
        }

        const items: { name: string; url: string; icon: LucideIcon }[] = []
        children.forEach((route) => {
            const { path, title } = route
            if (!path) return
            const top = path.split("/")[0]
            if (["logging", "my-schedule"].includes(top)) {
                const name = title || top.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
                items.push({ name, url: `${basePath}/${path}`, icon: Folder })
            }
        })
        return items
    }, [location.pathname])

    const finalProjects = computedProjects

    return (
        <SidebarGroup>

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
