import { Outlet } from 'react-router-dom'
import SidebarLayout from '@/components/shared/sidebars/Sidebar'
import { SidebarInset } from '@/components/ui/sidebar'
import DynamicHeader from '@/components/shared/headers/DynamicHeader'

export default function CashierLayout() {
    // For layout only
    // The outlet is where your component base on the routes will be so pakiayos
    // Headers, Sidebars, Notif Center, Footers will be put on this
    // Eto ung masterpage
    // Outlet iis ung mga pages
    return (
        <SidebarLayout>
            <SidebarInset>
                <DynamicHeader />
                <section>
                    <Outlet />
                </section>
            </SidebarInset>
        </SidebarLayout>
    )
}