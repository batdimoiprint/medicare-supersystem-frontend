import LandingHero from '@/components/landing/LandingHero'
import ClinicOverview from '@/components/landing/ClinicOverview'
import Services from '@/components/landing/Services'

const sectionShell = 'mx-auto w-full max-w-6xl px-4'

export default function LandingPage() {
    return (
        <>
            <LandingHero className={`${sectionShell} py-16 lg:py-24`} />
            <ClinicOverview className={`${sectionShell} py-12`} />
            <Services className={`${sectionShell} py-12`} />
        </>
    )
}
