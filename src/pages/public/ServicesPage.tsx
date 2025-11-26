// C:\Users\gulfe\Medi\medicare-supersystem-frontend-main\src\pages\public\ServicesPage.tsx

import { useState } from 'react'; 
import ServicesHero from '@/components/landing/Services/ServicesHero'; // Now imported as default
import ServicesCTA from '@/components/landing/Services/ServicesCTA';
import ServiceGrid, { type ServiceType } from '@/components/landing/Services/ServiceGrid'; 

// Imports for Modal Chain
import ServiceModal from '@/components/landing/Services/ServiceModal'; 
import DoctorProfileModal from '@/components/landing/Dentist/DoctorProfileModal';
import { DENTISTS, type Dentist } from '@/components/landing/Dentist/DentistList'; 


// Utility function to find the doctor based on specialty name
const findDoctorBySpecialty = (specialtyName: string): Dentist | undefined => {
    const normalizedTarget = specialtyName.toLowerCase().replace(/ /g, '');
    return DENTISTS.find((doc: Dentist) => {
        const docSpecialization = doc.specialization.toLowerCase().replace(/ /g, '');
        return docSpecialization.includes(normalizedTarget);
    });
};


export default function ServicesPage() {
    // --- State for Modals ---
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Dentist | null>(null);

    // --- Service Modal Handlers ---
    const openServiceModal = (service: ServiceType) => {
        setSelectedService(service);
        setSelectedDoctor(null); 
    };

    const closeServiceModal = () => {
        setSelectedService(null);
    };

    // --- Doctor Modal Handlers ---
    const closeDoctorModal = () => {
        setSelectedDoctor(null);
    };

    // 🔑 THE BRIDGE HANDLER: Service Modal -> Doctor Modal
    const handleFindSpecialists = (specialtyName: string) => {
        const doctor = findDoctorBySpecialty(specialtyName);
        
        closeServiceModal(); 
        
        if (doctor) {
            setSelectedDoctor(doctor);
        } else {
            console.warn(`No specific doctor profile found for specialty: ${specialtyName}.`);
            alert(`We're sorry, no specific specialist profile is currently linked to ${specialtyName}.`);
        }
    };
    
    return (
        <main className="bg-background min-h-screen">
            
            <ServicesHero />
            
            <div className="container mx-auto px-4 py-16 md:py-24">
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-12 text-center">Our Specialized Services</h2>
                
                <ServiceGrid onServiceClick={openServiceModal} />
                
                <div className="text-center mt-12">
                    <button
                        onClick={() => alert("Navigate to full Doctor Listing page here.")} 
                        className="inline-flex items-center justify-center rounded-lg text-lg font-bold transition-colors h-12 px-8 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
                    >
                        View All Doctors
                    </button>
                </div>
            </div>

            <ServicesCTA />

            {/* Service Modal Component */}
            <ServiceModal
                service={selectedService}
                onClose={closeServiceModal}
                onFindSpecialists={handleFindSpecialists} 
            />

            {/* Doctor Profile Modal Component */}
            <DoctorProfileModal
                doctor={selectedDoctor}
                isOpen={!!selectedDoctor} 
                onClose={closeDoctorModal}
                // FIX: Prop 'onViewServices' is required, so we pass a placeholder function
                onViewServices={() => alert("Service viewing feature not fully implemented.")} 
            />

        </main>
    );
}