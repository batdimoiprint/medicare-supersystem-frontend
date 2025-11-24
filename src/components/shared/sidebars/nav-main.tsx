"use client"

import {
    ChevronRight,
    type LucideIcon,
    Home,
    Calendar,
    Users,
    FileText,
    DollarSign,
    RotateCcw,
    Stethoscope,
    ClipboardList,
    Pill,
    UserCircle,
    Receipt,
    FolderOpen,
    Bell,
    Activity,
    ClipboardCheck,
    Truck,
    BarChart3,
    FileStack
} from "lucide-react"
import { receptionistRouteData } from "@/routes/receptionistRoutes"
import { adminRouteData } from "@/routes/adminRoutes"
import { cashierRouteData } from "@/routes/cashierRoutes"
import { inventoryRouteData } from "@/routes/inventoryRoutes"
import { patientRouteData } from "@/routes/patientRoutes"
import { dentistRouteData } from "@/routes/dentistRoutes"
import { useLocation, Link } from "react-router-dom"

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
    const location = useLocation()

    type RouteData = { index?: boolean; path?: string; element: React.ReactElement; title: string }

    // Select the appropriate route data and base path based on the current path
    let selectedRouteData: RouteData[] = receptionistRouteData
    let basePath = "/receptionist"
    if (location.pathname.startsWith("/admin")) {
        selectedRouteData = adminRouteData
        basePath = "/admin"
    } else if (location.pathname.startsWith("/cashier")) {
        selectedRouteData = cashierRouteData
        basePath = "/cashier"
    } else if (location.pathname.startsWith("/inventory")) {
        selectedRouteData = inventoryRouteData
        basePath = "/inventory"
    } else if (location.pathname.startsWith("/patient")) {
        selectedRouteData = patientRouteData
        basePath = "/patient"
    } else if (location.pathname.startsWith("/dentist")) {
        selectedRouteData = dentistRouteData
        basePath = "/dentist"
    } else if (location.pathname.startsWith("/receptionist")) {
        selectedRouteData = receptionistRouteData
        basePath = "/receptionist"
    }

    type SubItem = { title: string; url: string }
    type MainItem = { title: string; url: string; items?: SubItem[]; icon?: LucideIcon }

    // Icon mapping based on route title/purpose
    const getIconForRoute = (title: string): LucideIcon => {
        const titleLower = title.toLowerCase()

        // Dashboard icons
        if (titleLower.includes('dashboard')) return Home

        // Appointment related
        if (titleLower.includes('appointment')) return Calendar
        if (titleLower.includes('followup') || titleLower.includes('follow')) return Users
        if (titleLower.includes('cancel')) return RotateCcw

        // Payment/Financial
        if (titleLower.includes('payment')) return DollarSign
        if (titleLower.includes('refund')) return RotateCcw
        if (titleLower.includes('transaction')) return Receipt

        // Patient/Medical
        if (titleLower.includes('charting')) return Stethoscope
        if (titleLower.includes('patient record') || titleLower.includes('medical record')) return FolderOpen
        if (titleLower.includes('treatment plan')) return ClipboardList
        if (titleLower.includes('prescription')) return Pill
        if (titleLower.includes('profile')) return UserCircle

        // Inventory
        if (titleLower.includes('inventory table')) return FileStack
        if (titleLower.includes('stock')) return Activity
        if (titleLower.includes('supplier')) return Truck
        if (titleLower.includes('report') || titleLower.includes('reports')) return BarChart3

        // Schedule & Logging
        if (titleLower.includes('schedule')) return Calendar
        if (titleLower.includes('logging')) return ClipboardCheck

        // Notifications
        if (titleLower.includes('notification')) return Bell

        // Default
        return FileText
    }

    const finalItems: MainItem[] = selectedRouteData
        .filter(route => !route.path?.includes(':') && !route.title?.includes('Details'))
        .map((route) => ({
            title: route.title || 'Untitled',
            url: route.index ? basePath : `${basePath}/${route.path}`,
            icon: getIconForRoute(route.title || ''),
        }))

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {finalItems.map((item) => (
                    item.items && item.items.length ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={false}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title}>
                                        {item.icon && (() => {
                                            const Icon = item.icon as LucideIcon
                                            return <Icon className="mr-2 h-4 w-4" />
                                        })()}
                                        <span>{item.title}</span>
                                        <ChevronRight />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to={subItem.url}>
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton tooltip={item.title} asChild>
                                <Link to={item.url} className="flex items-center">
                                    {item.icon && (() => {
                                        const Icon = item.icon as LucideIcon
                                        return <Icon className="mr-2 h-4 w-4" />
                                    })()}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
