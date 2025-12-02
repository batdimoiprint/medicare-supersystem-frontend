"use client"

import * as React from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import BrandTitle from "../brand/BrandTitle"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/userContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth()

    // Build user data for NavUser component
    const userData = {
        name: user?.name ?? "Guest",
        email: user?.email ?? "",
        avatar: user?.avatar ?? "/avatars/default.jpg",
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <BrandTitle />

            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <NavMain />
            </SidebarContent>
            <Separator />
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
