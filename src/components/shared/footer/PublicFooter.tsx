import Logo from '@/components/shared/Logo'
import { Separator } from '@/components/ui/separator'
import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PublicFooter() {
    return (
        <footer className="w-full bg-background/60 text-muted-foreground border-t border-border">
            <div className="mx-auto  py-12">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: brand */}
                    <div className="lg:w-1/3 space-y-4 text-foreground">
                        <div className="flex items-center gap-3">
                            <Logo className="h-10 w-10" />
                            <div>
                                <p className="text-lg font-bold">MEDICARE Dental Clinic</p>
                                <p className="text-sm text-muted-foreground">Care that keeps you smiling — modern, gentle, trusted.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center pt-2">
                            <Mail className="size-5" />
                            <a className="text-sm text-muted-foreground hover:text-primary" href="mailto:hello@medicareclinic.example">hello@medicareclinic.example</a>
                        </div>

                        <p className="text-xs text-muted-foreground">Open Mon — Fri 8:00 — 18:00 · Sat 9:00 — 14:00</p>
                    </div>

                    {/* Middle: links */}
                    <nav className="hidden sm:flex gap-8 lg:w-1/3 justify-center">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">Services</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li><Link className="hover:text-primary" to="/services">General Dentistry</Link></li>
                                <li><Link className="hover:text-primary" to="/services">Orthodontics</Link></li>
                                <li><Link className="hover:text-primary" to="/services">Prosthodontics</Link></li>
                                <li><Link className="hover:text-primary" to="/services">Radiograph</Link></li>
                                <li><Link className="hover:text-primary" to="/services">Retainers</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">Company</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li><Link className="hover:text-primary" to="/about-us">About</Link></li>
                                <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
                                <li><Link className="hover:text-primary" to="/privacy">Privacy</Link></li>
                            </ul>
                        </div>
                    </nav>


                </div>

                <div className="mt-8">
                    <Separator />
                    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MEDICARE Dental Clinic — All rights reserved.</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <Link to="/terms" className="hover:text-primary">Terms</Link>
                            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
                            <Link to="/support" className="hover:text-primary">Support</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
