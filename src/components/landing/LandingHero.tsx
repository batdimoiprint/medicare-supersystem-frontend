import BlurText from '@/components/ui/BlurText'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import imgBubble1 from '@/components/assets/img_patient_1.png'
import imgBubble2 from '@/components/assets/img_patient_2.png'
import imgBubble3 from '@/components/assets/img_patient_3.png'
import imgBubble4 from '@/components/assets/img_patient_4.png'
import imgDentist from '@/components/assets/img_dentist.png'
import imgHome from '@/components/assets/img_cta.jpg'

type LandingHeroProps = {
    className?: string
}

export default function LandingHero({ className }: LandingHeroProps) {
    return (
        <section className={cn('relative overflow-hidden bg-background', className)}>
            <div className="absolute inset-0 -z-10">
                <img src={imgHome} alt="clinic background" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-primary/80" />
            </div>

            <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
                <div className="space-y-8 text-primary-foreground">
                    <BlurText
                        text="The Art and Care of a Perfect Smile."
                        delay={120}
                        className="text-4xl text-primary font-extrabold leading-tight tracking-wide md:text-5xl"
                    />
                    <p className="text-primary  md:text-lg">
                        Personalized dental care that blends modern technology with compassionate service—so you smile with confidence every day.
                    </p>
                    <Button size="lg" className="min-w-48">
                        Book Now
                    </Button>
                </div>

                <div className="relative hidden lg:block">
                    <div className="mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-4xl bg-card shadow-2xl">
                        <img src={imgDentist} alt="Dentist with patient" className="h-full w-full object-cover" />
                    </div>

                    <div className="absolute inset-0 -z-10 blur-3xl" aria-hidden>
                        <div className="absolute left-4 top-0 h-64 w-64 rounded-full bg-primary/50" />
                        <div className="absolute right-0 top-12 h-56 w-56 rounded-full bg-secondary/40" />
                    </div>

                    <div className="absolute inset-x-0 top-8 flex justify-between">
                        {[imgBubble1, imgBubble2].map((img, index) => (
                            <div key={img} className={cn('size-32 rounded-full border-4 border-card shadow-lg', index === 0 ? 'translate-x-6' : '-translate-x-6')}>
                                <img src={img} alt="Happy patient" className="h-full w-full rounded-full object-cover" />
                            </div>
                        ))}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex justify-between">
                        {[imgBubble3, imgBubble4].map((img, index) => (
                            <div key={img} className={cn('size-28 rounded-full border-4 border-card shadow-lg', index === 0 ? 'translate-y-6' : '-translate-y-4')}>
                                <img src={img} alt="Clinic experience" className="h-full w-full rounded-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
