// removed unused imgDentist import
import imgPatient1 from '@/components/assets/img_patient_1.png'
import imgPatient2 from '@/components/assets/img_patient_2.png'
import imgPatient3 from '@/components/assets/img_patient_3.png'
import imgPatient4 from '@/components/assets/img_patient_4.png'
import ChromaGrid from '@/components/ChromaGrid'

const collagePhotos = [imgPatient1, imgPatient2, imgPatient3, imgPatient4]



export default function ClinicOverview() {
    const chromaItems = collagePhotos.map(img => ({
        image: img,
        title: '',
        subtitle: '',
        handle: null,
        url: null,
        borderColor: 'transparent',
        gradient: 'linear-gradient(145deg, var(--color-card), var(--color-muted))'
    }));

    return (
        <section className="flex flex-col py-16 gap-8 lg:flex-row">
            {/* Collage (2/5) - 2x2 grid, fills its container */}
            <div className="w-full h-[600px] bg-background relative lg:flex-[0.4] rounded-2xl overflow-hidden">
                {/* Desktop: interactive ChromaGrid. Hidden on small screens */}
                <div className="hidden lg:block h-full w-full">
                    <ChromaGrid
                        items={chromaItems}
                        radius={300}
                        damping={0.45}
                        fadeOut={0.6}
                        ease="power3.out"
                        columns={2}
                        rows={2}
                        className="h-full w-full"
                    />
                </div>

                {/* Mobile / Tablet fallback: simple contained 2x2 image grid — no interactive chroma */}
                <div className="block lg:hidden h-full w-full p-3 box-border">
                    <div className="grid grid-cols-2 gap-2 h-full">
                        {chromaItems.map((it, i) => (
                            <div key={i} className="rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                <img src={it.image} alt={`clinic-${i}`} className="w-full h-full object-contain" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Text content (3/5) */}
            <div className="space-y-6 text-foreground lg:flex-[0.6]">
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
        </section>
    )
}
