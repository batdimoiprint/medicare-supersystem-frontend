import BlurText from '@/components/ui/BlurText'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import imgBubble1 from '@/components/assets/img_patient_1.png'
import imgBubble2 from '@/components/assets/img_patient_2.png'
import imgBubble3 from '@/components/assets/img_patient_3.png'
import imgBubble4 from '@/components/assets/img_patient_4.png'
import imgDentist from '@/components/assets/img_dentist.png'

export default function LandingHero() {
    return (
        <section className="flex flex-row items-center  justify-between py-16">
            <div className="w-full max-w-xl space-y-8">

                <BlurText
                    delay={120}
                    className="text-4xl font-extrabold leading-tight tracking-wide text-primary md:text-5xl"
                    text="The Art and Care of a Perfect Smile."
                />
                <p className="text-foreground md:text-lg">
                    Personalized dental care that blends modern technology with compassionate service so you smile with confidence every day.
                </p>
                <Button size="lg" className="font-bold text-lg min-w-72" asChild>
                    <Link to="/register">Register Now!</Link>
                </Button>
            </div>

            <div className="relative hidden lg:block">
                <div className="w-full max-w-lg mx-auto">
                    <img src={imgDentist} alt="Dentist with patient" className="object-contain w-full h-full" />
                </div>



                <div className="absolute inset-x-0 flex justify-between top-8">
                    {[imgBubble1, imgBubble2].map((img) => (
                        <div key={img} className='border-4 rounded-full shadow-lg size-32 border-card animate-float'>
                            <img src={img} alt="Happy patient" className="object-cover w-full h-full rounded-full" />
                        </div>
                    ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 flex justify-between">
                    {[imgBubble3, imgBubble4].map((img, index) => (
                        <div
                            key={img}
                            className={
                                'size-28 rounded-full border-4 border-card shadow-lg animate-float ' +
                                (index === 0 ? 'translate-y-6' : '-translate-y-4')
                            }
                        >
                            <img src={img} alt="Clinic experience" className="object-cover w-full h-full rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

        </section>
    )
}
