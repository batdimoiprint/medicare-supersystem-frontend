import PublicHeader from '@/components/shared/headers/PublicHeader'
import { Outlet } from 'react-router-dom'


export default function PublicLayout() {

    // For layout only
    // The outlet is where your component base on the routes will be so pakiayos


    //Headers, Sidebars, Notif Center, Footers will be put on thisshi

    // Eto ung masterpage
    // Outlet iis ung mga pages


    return (
        <main
            className={
                'flex flex-col   min-h-screen px-4 sm:px-8 md:px-16 lg:px-32 xl:px-72 bg-background'
            }
        >
            <PublicHeader />
            <Outlet />
        </main>
    )
}
