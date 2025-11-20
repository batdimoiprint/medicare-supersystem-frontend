import PublicHeader from '@/components/shared/headers/PublicHeader'
import { Outlet } from 'react-router-dom'


export default function PublicLayout() {

    // For layout only
    // The outlet is where your component base on the routes will be so pakiayos


    //Headers, Sidebars, Notif Center, Footers will be put on thisshi

    // Eto ung masterpage
    // Outlet iis ung mga pages


    return (
        <>
            <PublicHeader />
            <main className="space-y-16 pb-8 pt-8">
                <Outlet />
            </main>
        </>
    )
}
