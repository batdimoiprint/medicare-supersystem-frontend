import imgDentist from '@/components/assets/img_dentist.png'
import imgPatient1 from '@/components/assets/img_patient_1.png'
import imgPatient2 from '@/components/assets/img_patient_2.png'
import imgPatient3 from '@/components/assets/img_patient_3.png'
import imgPatient4 from '@/components/assets/img_patient_4.png'
import { cn } from '@/lib/utils'

const collagePhotos = [imgPatient1, imgPatient2, imgDentist, imgPatient3, imgPatient4]

type ClinicOverviewProps = {
    className?: string
}

export default function ClinicOverview({ className }: ClinicOverviewProps) {
    return (
        <section className={className}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {collagePhotos.map((photo, idx) => (
                        <div key={photo} className={cn('overflow-hidden rounded-3xl bg-muted shadow-md', idx === 2 ? 'col-span-2' : '')}>
                            <img src={photo} alt="Clinic experience" className="h-48 w-full object-cover sm:h-56" />
                        </div>
                    ))}
                </div>

                <div className="space-y-6 text-foreground">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                            Welcome to Medicare Dental Clinic
                        </p>
                        <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                            Where healthy smiles begin and compassionate care thrives.
                        </h2>
                        <p className="text-base text-muted-foreground md:text-lg">
                            At MEDICARE, every treatment plan is designed to keep you comfortable while delivering exceptional clinical results. From routine cleanings to advanced cosmetic services, our team supports you at every milestone.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <h3 className="text-2xl font-semibold text-foreground">Our Promise to You</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li>
                                <span className="font-semibold text-foreground">Patient-Centered Care.</span> We honor your preferences with treatment options tailored to your lifestyle.
                            </li>
                            <li>
                                <span className="font-semibold text-foreground">Experienced Dentists.</span> A multidisciplinary team brings years of expertise to every chairside moment.
                            </li>
                            <li>
                                <span className="font-semibold text-foreground">Modern Technology.</span> Digital X-rays, painless anesthesia, and advanced imaging keep care precise and comfortable.
                            </li>
                            <li>
                                <span className="font-semibold text-foreground">Comfort &amp; Safety.</span> We maintain strict sterilization protocols so you can relax with confidence.
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3 text-muted-foreground">
                        <p>A visit to MEDICARE is more than a check-up—it is a warm, welcoming experience.</p>

                    </div>
                </div>
            </div>
        </section>
    )
}
