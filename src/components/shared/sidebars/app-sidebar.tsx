"use client"

import * as React from "react"
import { useLocation } from "react-router-dom"

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

// Get user data based on current role/path
// TODO: Replace with actual auth context when authentication is implemented
function useCurrentUser() {
    const location = useLocation()
    const path = location.pathname

    if (path.startsWith("/admin")) {
        return { name: "Admin", email: "admin@medicare.com", avatar: "" }
    } else if (path.startsWith("/dentist")) {
        return { name: "Dentist", email: "dentist@medicare.com", avatar: "" }
    } else if (path.startsWith("/receptionist")) {
        return { name: "Receptionist", email: "receptionist@medicare.com", avatar: "" }
    } else if (path.startsWith("/cashier")) {
        return { name: "Cashier", email: "cashier@medicare.com", avatar: "" }
    } else if (path.startsWith("/inventory")) {
        return { name: "Inventory Manager", email: "inventory@medicare.com", avatar: "" }
    } else if (path.startsWith("/patient")) {
        return { name: "Patient", email: "patient@medicare.com", avatar: "" }
    }
    
    return { name: "User", email: "user@medicare.com", avatar: "" }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const user = useCurrentUser()
    
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
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
