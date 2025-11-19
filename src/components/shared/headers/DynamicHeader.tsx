"use client"

import React from "react"
import { useLocation } from "react-router-dom"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { dentistRouteData } from "@/routes/dentistRoutes"
import { adminRouteData } from "@/routes/adminRoutes"
import { cashierRouteData } from "@/routes/cashierRoutes"
import { inventoryRouteData } from "@/routes/inventoryRoutes"
import { patientRouteData } from "@/routes/patientRoutes"
import { receptionistRouteData } from "@/routes/receptionistRoutes"

function humanize(seg?: string) {
    if (!seg) return ""
    return seg
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
}

export default function DynamicHeader() {
    const location = useLocation()

    const { basePath, routeList } = React.useMemo(() => {
        const path = location.pathname
        const parts = path.split("/").filter(Boolean)
        const base = parts[0] || ""

        switch (base) {
            case "dentist":
                return { basePath: "/dentist", routeList: dentistRouteData }
            case "admin":
                return { basePath: "/admin", routeList: adminRouteData }
            case "cashier":
                return { basePath: "/cashier", routeList: cashierRouteData }
            case "inventory":
                return { basePath: "/inventory", routeList: inventoryRouteData }
            case "patient":
                return { basePath: "/patient", routeList: patientRouteData }
            case "receptionist":
                return { basePath: "/receptionist", routeList: receptionistRouteData }
            default:
                return { basePath: "/", routeList: [] }
        }
    }, [location.pathname])

    const pageTitle = React.useMemo(() => {
        // remove base path
        const raw = location.pathname.replace(basePath, "").replace(/^\//, "")
        if (!raw) {
            // index route
            const idx = routeList.find((r) => r.index)
            return idx?.title || humanize(basePath.replace("/", "")) || "Home"
        }
        // try to find a route with exact path
        const found = routeList.find((r) => r.path === raw)
        if (found) return found.title || humanize(raw)

        // If not found, look for partial matches, then humanize
        const segments = raw.split("/")
        // Try to match top level item
        const topPath = segments[0]
        const top = routeList.find((r) => r.path?.split("/")[0] === topPath)
        if (top && segments.length === 1) return top.title || humanize(topPath)
        if (top && segments.length > 1) {
            // try to find the exact nested route
            const nested = routeList.find((r) => r.path === `${topPath}/${segments.slice(1).join("/")}`)
            if (nested) return nested.title || humanize(segments.slice(1).join(" "))
            return top.title || humanize(topPath)
        }

        // fallback to humanized path
        const last = segments[segments.length - 1]
        return humanize(last)
    }, [location.pathname, routeList, basePath])

    const crumbs = React.useMemo(() => {
        const arr: { title: string; href?: string }[] = []
        // root
        if (basePath !== "/") arr.push({ title: humanize(basePath.replace("/", "")), href: basePath })
        // page
        if (pageTitle) arr.push({ title: pageTitle })
        return arr
    }, [basePath, pageTitle])

    return (
        <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {crumbs.length > 0 && (
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href={crumbs[0].href || '#'}>{crumbs[0].title}</BreadcrumbLink>
                            </BreadcrumbItem>
                        )}

                        <BreadcrumbSeparator className="hidden md:block" />

                        <BreadcrumbItem>
                            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    )
}
