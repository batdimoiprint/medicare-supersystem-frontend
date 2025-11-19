"use client"

import { ChevronRight, type LucideIcon, Home, Calendar, Users, FileText, Clock, List, Settings } from "lucide-react"
import React from "react"
import { useLocation } from "react-router-dom"
import { dentistRouteData } from "@/routes/dentistRoutes"
import { adminRouteData } from "@/routes/adminRoutes"
import { cashierRouteData } from "@/routes/cashierRoutes"
import { inventoryRouteData } from "@/routes/inventoryRoutes"
import { patientRouteData } from "@/routes/patientRoutes"
import { receptionistRouteData } from "@/routes/receptionistRoutes"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain() {
    // location is not required here; keep the computation deterministic

    // If items are provided via props, use them; otherwise derive from dentistRoutes
    const location = useLocation()

    const computedItems = React.useMemo(() => {
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

        type SubItem = { title: string; url: string }
        type MainItem = { title: string; url: string; items?: SubItem[]; icon?: LucideIcon }

        const ICONS: LucideIcon[] = [Home, Calendar, Users, FileText, Clock, List, Settings]

        const mainMap = new Map<string, MainItem>()

        function humanize(seg: string) {
            return seg
                .split("-")
                .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ")
        }

        children.forEach((route) => {
            const { path, index, title: routeTitle } = route
            if (index) {
                // Dashboard index route
                const title = routeTitle || "Dashboard"
                mainMap.set("__index__", { title, url: basePath, icon: ICONS[Math.floor(Math.random() * ICONS.length)] })
                return
            }

            if (!path) return

            const fullPath = `${basePath}${path.startsWith("/") ? path : `/${path}`}`
            const segments = path.split("/")
            const top = segments[0]

            // Skip projects (logging and my-schedule) here
            if (["logging", "my-schedule"].includes(top)) {
                return
            }

            if (segments.length === 1) {
                // top level route, e.g., appointments
                mainMap.set(top, { title: routeTitle || humanize(top), url: fullPath, icon: ICONS[Math.floor(Math.random() * ICONS.length)] })
            } else {
                // nested route - group under top (e.g., patient/charting or appointments/followup)
                const parent = mainMap.get(top) || { title: humanize(top), url: `${basePath}/${top}`, items: [], icon: ICONS[Math.floor(Math.random() * ICONS.length)] }
                const subPath = segments.slice(1).join("/")
                parent.items = parent.items || []
                parent.items.push({ title: routeTitle || humanize(subPath.replace(/\//g, " ")), url: fullPath })
                mainMap.set(top, parent)
            }
        })

        // Convert map to array
        const result: MainItem[] = []
        if (mainMap.has("__index__")) {
            const idx = mainMap.get("__index__")
            if (idx) result.push(idx)
        }
        for (const [key, value] of mainMap.entries()) {
            if (key === "__index__") continue
            result.push(value)
        }
        return result
    }, [])

    const finalItems = computedItems

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {finalItems.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={Boolean(location.pathname.startsWith(item.url))}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={item.title}>
                                    {item.icon && (() => {
                                        const Icon = item.icon as LucideIcon
                                        // Icon is a component; render it
                                        return <Icon className="mr-2 h-4 w-4" />
                                    })()}
                                    <span>{item.title}</span>
                                    <ChevronRight />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {item.items?.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild>
                                                <a href={subItem.url}>
                                                    <span>{subItem.title}</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
