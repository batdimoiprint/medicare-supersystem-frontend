import { Outlet } from 'react-router-dom'
import SidebarLayout from "@/components/shared/sidebars/Sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import DynamicHeader from "@/components/shared/headers/DynamicHeader"


// Header is now handled by DynamicHeader



export default function DentistLayout() {

    return (
        <>
            <SidebarLayout>
                    <SidebarInset className='flex flex-col box-content w-full px-4 gap-4 '>
                        <DynamicHeader />
                        <section className='flex flex-col gap-4 '>
                            <Outlet />
                        </section>
                    </SidebarInset>
            </SidebarLayout>

        </>
    )
}
