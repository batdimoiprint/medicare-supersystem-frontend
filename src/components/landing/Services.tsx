import { Button } from '@/components/ui/button'
import imgGeneralDentistry from '@/components/assets/img_general_dentistry.png'
import imgOrthodontics from '@/components/assets/img_orthodontics.png'
import imgProsthodontics from '@/components/assets/img_prosthodontics.png'
import imgRadiograph from '@/components/assets/img_radiograph.png'
import imgRetainers from '@/components/assets/img_retainers.png'
import { Card } from '../ui/card'
import { Link } from 'react-router-dom'

const services = [
    { title: 'General Dentistry', image: imgGeneralDentistry },
    { title: 'Orthodontics', image: imgOrthodontics },
    { title: 'Prosthodontics', image: imgProsthodontics },
    { title: 'Radiograph', image: imgRadiograph },
    { title: 'Retainers', image: imgRetainers },
]



export default function Services() {
    return (
        <section className="py-16" >
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
                        <Card key={service.title} className="flex flex-col items-center ">
                            <div className="flex size-24 items-center justify-center ">
                                <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground md:text-sm">
                                {service.title}
                            </h4>
                        </Card>
                    ))}
                </div>
                <Link to="/services">
                    <Button variant="default" size="lg" className="mx-auto">
                        See More
                    </Button>
                </Link>
            </div>
        </ section>
    )
}
