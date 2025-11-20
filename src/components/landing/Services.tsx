import { Button } from '@/components/ui/button'
import imgDentist from '@/components/assets/img_dentist.png'
import imgPatient1 from '@/components/assets/img_patient_1.png'
import imgPatient2 from '@/components/assets/img_patient_2.png'
import imgPatient3 from '@/components/assets/img_patient_3.png'
import imgPatient4 from '@/components/assets/img_patient_4.png'
import { cn } from '@/lib/utils'

const services = [
    { title: 'General Dentistry', image: imgDentist },
    { title: 'Orthodontics', image: imgPatient1 },
    { title: 'Prosthodontics', image: imgPatient2 },
    { title: 'Radiograph', image: imgPatient3 },
    { title: 'Retainers', image: imgPatient4 },
]

type ServicesProps = {
    className?: string
}

export default function Services({ className }: ServicesProps) {
    return (
        <section className={cn('rounded-3xl bg-card shadow-sm', className)}>
            <div className="space-y-6 text-center">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">Services</p>
                    <h3 className="text-3xl font-bold text-foreground md:text-4xl">All-in-one care for every smile</h3>
                    <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
                        Preventive visits, advanced restorations, and modern smile design—delivered with the same attention to comfort and detail.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {services.map(service => (
                        <article key={service.title} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 text-center shadow-sm">
                            <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl bg-muted">
                                <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground md:text-sm">
                                {service.title}
                            </h4>
                        </article>
                    ))}
                </div>

                <Button variant="secondary" size="lg" className="mx-auto">
                    See More
                </Button>
            </div>
        </section>
    )
}
