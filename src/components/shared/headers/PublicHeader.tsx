
import { MenuIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Label } from '@radix-ui/react-label'


const PublicHeader = () => {
    return (
        <header className='bg-background sticky top-0 z-50'>
            <div className='mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-7 sm:px-6'>
                <Link to='/' className='flex flex-row-reverse ml-4 gap-4 items-center'> <Label>Medicare</Label> <Logo /></Link>
                <div className='text-muted-foreground flex flex-1 items-center gap-8 font-medium md:justify-center lg:gap-16'>
                    <Link to='/services' className='hover:text-primary max-md:hidden'>Services Offered</Link>
                    <Link to='/our-dentist' className='hover:text-primary max-md:hidden'>Our Dentists</Link>

                    <Link to='/about-us' className='hover:text-primary max-md:hidden'>About Us</Link>
                    <Link to='/contact' className='hover:text-primary max-md:hidden'>Contact</Link>


                </div>
                <Link to='/login' className='hover:text-primary max-md:hidden'><Button>Log In</Button></Link>
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
                                <DropdownMenuItem><Link to='/services'>Clinic Overview</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/dentist'>Services Offered</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/dentist'>Our Dentists</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/contact'>About Us</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/contact'>Contact Us</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/login'>Login</Link></DropdownMenuItem>
                                <DropdownMenuItem><Link to='/register'>Register</Link></DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}


export default PublicHeader
