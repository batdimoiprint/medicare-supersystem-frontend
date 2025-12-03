import { useState, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import ServicesHero from '@/components/landing/Services/ServicesHero'; 
import ServicesCTA from '@/components/landing/Services/ServicesCTA';
import ServiceGrid, { type ServiceType, SERVICES } from '@/components/landing/Services/ServiceGrid'; 

// Imports for Modal Chain
import ServiceModal, { forceRemoveScrollLock } from '@/components/landing/Services/ServiceModal';
import DoctorProfileModal from '@/components/landing/Dentist/DoctorProfileModal';
import { DENTISTS, type Dentist } from '@/components/landing/Dentist/DentistList'; 
// The Selection Modal is still imported but its logic is bypassed in the handlers
import ServiceSelectionModal from '@/components/landing/Dentist/ServiceSelectionModal';


// Utility function to find the service object by normalizing the input name (KEPT)
const findServiceByName = (specialtyName: string): ServiceType | undefined => {
    const primaryServiceName = specialtyName
        .split(',')[0] 
        .split(' & ')[0] 
        .trim();
    return SERVICES.find(service => service.name === primaryServiceName);
}

// Utility function to find the doctor based on specialty name (KEPT)
const findDoctorBySpecialty = (specialtyName: string): Dentist | undefined => {
    const normalizedTarget = specialtyName.toLowerCase().replace(/ /g, '');
    return DENTISTS.find((doc: Dentist) => {
        const docSpecialization = doc.specialization.toLowerCase().replace(/ /g, '');
        return docSpecialization.includes(normalizedTarget);
    });
};

// Utility function to parse a specialization string into an array of clean specialty names (KEPT)
const parseSpecialties = (specialization: string): string[] => {
    return specialization
        .split(/[&,]/) 
        .map(s => s.trim())
        .filter(s => s.length > 0);
};

// Type for selected doctor with a service highlight property
type SelectedDoctorWithHighlight = Dentist & {
    highlightedServiceName?: string;
};


export default function ServicesPage() {
    const navigate = useNavigate();
    const location = useLocation(); 
    
    // --- State for Modals ---
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<SelectedDoctorWithHighlight | null>(null); 
    const [selectionOptions, setSelectionOptions] = useState<string[] | null>(null); // Kept for rendering the selection modal, even if the flow bypasses it

    // --- Modal Handlers ---
    
    // 🔑 Aggressively clear ALL states AND force unlock scroll.
    const closeServiceModal = () => {
        setSelectedService(null);
        setSelectedDoctor(null);
        setSelectionOptions(null);
        
        // 🔥 FORCE UNLOCK SCROLL 🔥
        forceRemoveScrollLock(); 
    };

    // Aggressively clear Doctor and Selection states when Doctor Profile Modal closes
    const closeDoctorModal = () => {
        setSelectedDoctor(null);
        setSelectionOptions(null);
    };
    
    // Selection Modal close handler
    const closeSelectionModal = () => {
        setSelectionOptions(null);
    };

    
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const serviceName = query.get('service');

        if (serviceName) {
            const service = findServiceByName(serviceName);
            
            if (service) {
                setSelectedService(service);
            } else {
                 console.warn(`Could not find service: ${serviceName} from URL query.`);
            }

            navigate(location.pathname, { replace: true });
        }
    }, [location.search]); 

    // 🔑 FINAL FIX: Service Modal -> Doctor Profile Modal (Direct Link)
    const handleFindSpecialists = (specialtyName: string) => {
        const doctor = findDoctorBySpecialty(specialtyName);
        
        closeServiceModal(); // Clears all states and unlocks scroll
        
        if (doctor) {
            // FORCE OPEN DOCTOR PROFILE: Set the doctor state with the service name to highlight it
            const doctorWithHighlight: SelectedDoctorWithHighlight = { 
                ...doctor, 
                highlightedServiceName: specialtyName 
            };
            setSelectedDoctor(doctorWithHighlight);
        } else {
            console.warn(`No specific doctor profile found for specialty: ${specialtyName}.`);
            alert(`We're sorry, no specific specialist profile is currently linked to ${specialtyName}.`);
        }
    };

    // 🔑 SIMPLIFIED HANDLER: Doctor Profile -> Service Modal (Always opens the final service modal)
    const handleViewSpecialtyFromDoctor = (specialization: string) => {
        // Use the specialization string to derive the service name (e.g., 'Orthodontics & Cosmetic Dentistry' -> 'Orthodontics')
        const serviceName = parseSpecialties(specialization)[0]; 
        
        closeDoctorModal(); // Close the Doctor Profile first
        
        const service = findServiceByName(serviceName); 
        
        if (service) {
            setSelectedService(service); 
        } else {
            console.warn(`Could not find service: ${serviceName}. Navigating to main services page.`);
            navigate("/services"); 
        }
    };

    // 🔑 UNUSED HANDLER IN THIS FLOW: This handler will never be called due to the simplified flow above
    const handleSelectSpecialtyFromDoctor = (specialtyName: string) => {
        closeSelectionModal(); 
        closeDoctorModal(); 
        const service = findServiceByName(specialtyName); 
        if (service) {
            setSelectedService(service);
        } else {
            console.warn(`Could not find service: ${specialtyName}. Navigating to main services page.`);
            navigate("/services"); 
        }
    };
    
    return (
        <main className="bg-background min-h-screen">
            
            <ServicesHero />
            
            <div className="container mx-auto px-4 py-16 md:py-24">
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-12 text-center">Our Specialized Services</h2>
                
                <ServiceGrid onServiceClick={service => {setSelectedDoctor(null); setSelectedService(service);}} />
                
            </div>

            <ServicesCTA />

            {/* Service Modal Component */}
            <ServiceModal
                service={selectedService}
                onClose={closeServiceModal}
                onFindSpecialists={handleFindSpecialists} 
            />

            {/* RENDER Service Selection Modal (Hidden/Bypassed in this flow, but kept for compilation) */}
            <ServiceSelectionModal
                doctor={selectedDoctor}
                specialtyOptions={selectionOptions || []}
                onSelectService={handleSelectSpecialtyFromDoctor}
                // Close selection modal and doctor profile on cancel click
                onClose={() => { closeSelectionModal(); closeDoctorModal(); }} 
            />

            {/* Doctor Profile Modal Component */}
            <DoctorProfileModal
                doctor={selectedDoctor}
                // Open state is now simpler: just check if a doctor is selected
                isOpen={!!selectedDoctor} 
                // Pass the chosen service for highlighting
                highlightedServiceName={selectedDoctor?.highlightedServiceName} 
                onClose={closeDoctorModal}
                onViewSpecialty={handleViewSpecialtyFromDoctor} 
            />
            

        </main>
    );
}