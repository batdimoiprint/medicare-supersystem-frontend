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
            <SidebarInset className='flex flex-col box-content w-full px-4 gap-4 '>
                <DynamicHeader />
                <section className='flex flex-col gap-4 '>
                    <Outlet />
                </section>
            </SidebarInset>
        </SidebarLayout>
    )
}