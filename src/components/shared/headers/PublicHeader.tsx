
import { MenuIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth, useUserDashboard } from '@/context/userContext'

import BrandTitle from '../brand/BrandTitle'


const PublicHeader = () => {
    const { user, isAuthenticated } = useAuth()
    const dashboardRoute = useUserDashboard()

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <header className='sticky top-0 z-50 bg-background'>
            <div className='flex items-center justify-between gap-8 py-7 '>
                <Link to="/">
                    <BrandTitle />
                </Link>
                <div className='flex items-center flex-1 gap-8 font-medium text-muted-foreground md:justify-center lg:gap-16'>
                    <Link to='/services' className='text-foreground hover:text-primary max-md:hidden'>Services Offered</Link>
                    <Link to='/our-dentist' className='text-foreground hover:text-primary max-md:hidden'>Our Dentists</Link>
                    <Link to='/about-us' className='text-foreground hover:text-primary max-md:hidden'>About Us</Link>
                    <Link to='/contact' className='text-foreground hover:text-primary max-md:hidden'>Contact</Link>
                </div>
                <div className='flex gap-8'>
                    {isAuthenticated && user ? (
                        <div className='flex items-center gap-4 max-md:hidden'>
                            <Button asChild>
                                <Link to={dashboardRoute}>Dashboard</Link>
                            </Button>
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                        </div>
                    ) : (
                        <Link to='/login' className='text-foreground hover:text-primary max-md:hidden'>
                            <Button>Log In</Button>
                        </Link>
                    )}
                    <div className='flex items-center gap-6'>
                        <Button variant='ghost' size='icon' asChild>
                            <ModeToggle />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger className='md:hidden' asChild>
                                <Button variant='outline' size='icon'>
                                    <MenuIcon />
                                    <span className='sr-only'>Menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-56' align='end'>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem><Link to='/services'>Services Offered</Link></DropdownMenuItem>
                                    <DropdownMenuItem><Link to='/our-dentist'>Our Dentists</Link></DropdownMenuItem>
                                    <DropdownMenuItem><Link to='/about-us'>About Us</Link></DropdownMenuItem>
                                    <DropdownMenuItem><Link to='/contact'>Contact Us</Link></DropdownMenuItem>
                                    {isAuthenticated && user ? (
                                        <DropdownMenuItem><Link to={dashboardRoute}>Dashboard</Link></DropdownMenuItem>
                                    ) : (
                                        <>
                                            <DropdownMenuItem><Link to='/login'>Login</Link></DropdownMenuItem>
                                            <DropdownMenuItem><Link to='/register'>Register</Link></DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}


export default PublicHeader
