import { Outlet } from 'react-router-dom'

export default function DentistLayout() {
    // For layout only
    // The outlet is where your component base on the routes will be so pakiayos
    // Headers, Sidebars, Notif Center, Footers will be put on this
    // Eto ung masterpage
    // Outlet iis ung mga pages
    return (
        <>
            <Outlet />
        </>
    )
}
