import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DentistHeader from '@/components/landing/Dentist/DentistHeader';
import DentistList from '@/components/landing/Dentist/DentistList'; 
import DoctorProfileModal from '@/components/landing/Dentist/DoctorProfileModal';
import ServiceModal from '@/components/landing/Services/ServiceModal';
import { DENTISTS, type Dentist } from '@/components/landing/Dentist/DentistList'; 
import { SERVICES, type ServiceType } from '@/components/landing/Services/ServiceGrid'; 
// 🔑 NEW IMPORT: Service Selection Modal
import ServiceSelectionModal from '@/components/landing/Dentist/ServiceSelectionModal';


// 🔑 Utility function to find the service object by normalizing the input name
const findServiceByName = (specialtyName: string): ServiceType | undefined => {
    // Extract the primary service name by splitting at the comma (for secondary focus) or ampersand (for combined services)
    const primaryServiceName = specialtyName
        .split(',')[0] 
        .split(' & ')[0] 
        .trim();

    return SERVICES.find(service => service.name === primaryServiceName);
}

// Utility function to find the doctor based on specialty name (Kept as is)
const findDoctorBySpecialty = (specialtyName: string): Dentist | undefined => {
    const normalizedTarget = specialtyName.toLowerCase().replace(/ /g, '');
    return DENTISTS.find((doc: Dentist) => {
        const docSpecialization = doc.specialization.toLowerCase().replace(/ /g, '');
        return docSpecialization.includes(normalizedTarget);
    });
};

// 🔑 NEW UTILITY: Parses a specialization string into an array of clean specialty names
const parseSpecialties = (specialization: string): string[] => {
    return specialization
        .split(/[&,]/) 
        .map(s => s.trim())
        .filter(s => s.length > 0);
};

// 🔑 NEW TYPE: Extend Doctor type to carry the highlighted service name
type SelectedDoctorWithHighlight = Dentist & {
    highlightedServiceName?: string;
};


export default function OurDentistPage() {
    const navigate = useNavigate();
    
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    // 🔑 UPDATED: Use the new type for selectedDoctor state
    const [selectedDoctor, setSelectedDoctor] = useState<SelectedDoctorWithHighlight | null>(null); 
    
    // 🔑 NEW STATE: To manage the specialty selection choice
    const [selectionOptions, setSelectionOptions] = useState<string[] | null>(null);


    // --- Modal Handlers ---
    const closeServiceModal = () => setSelectedService(null);
    const closeDoctorModal = () => setSelectedDoctor(null); 
    const closeSelectionModal = () => setSelectionOptions(null);
    
    const handleCloseProfiles = () => {
        navigate("/services");
    };

    // 🔑 UPDATED HANDLER: Doctor Modal -> Selection Modal OR Service Modal
    const handleViewServiceFromDoctor = (specialization: string) => {
        closeDoctorModal();

        const doctor = DENTISTS.find(doc => doc.specialization === specialization);
        if (!doctor) return;
        
        const specialties = parseSpecialties(specialization);
        
        if (specialties.length > 1) {
            // Multi-specialty: Show the selection modal
            setSelectedDoctor(doctor);
            setSelectionOptions(specialties);
        } else {
            // Single specialty: Open the final service modal directly
            const serviceName = specialties[0];
            
            const service = findServiceByName(serviceName); 
            if (service) {
                setSelectedService(service);
            } else {
                alert(`Service details for "${serviceName}" could not be loaded. Please ensure the service name exists.`);
            }
        }
    };

    // 🔑 NEW HANDLER: Service Selection Modal -> Service Modal (Final step)
    const handleSelectSpecialtyFromDoctor = (specialtyName: string) => {
        // 1. Close the selection modal
        closeSelectionModal(); 
        closeDoctorModal(); // Close the profile too

        // 2. Open the final Service Modal
        const service = findServiceByName(specialtyName); 
        
        if (service) {
            setSelectedService(service); // Opens the final ServiceModal
        } else {
            console.warn(`Could not find service: ${specialtyName}.`);
        }
    };


    // Handler to transition from Service Modal back to Doctor Modal (KEPT)
    const handleFindSpecialists = (specialtyName: string) => {
        closeServiceModal(); 
        
        const doctor = findDoctorBySpecialty(specialtyName); 
        
        if (doctor) {
            // Single specialty: Open profile directly with highlight
            setSelectedDoctor({ ...doctor, highlightedServiceName: specialtyName });
        } else {
            console.warn(`No specific doctor profile found for specialty: ${specialtyName}.`);
            alert(`We're sorry, no specific specialist profile is currently linked to ${specialtyName}.`);
        }
    };
    
    // Handler to open the Doctor Modal when clicking a card in DentistList
    const handleDoctorCardClick = (doctor: Dentist) => {
        closeServiceModal();
        setSelectedDoctor(doctor);
    };


    return (
        <main className="bg-background min-h-screen">
            
            <DentistHeader />
            
            <DentistList 
                onCloseProfiles={handleCloseProfiles}
                onDoctorSelect={handleDoctorCardClick}
            /> 
            
            {/* Service Modal */}
            <ServiceModal
                service={selectedService}
                onClose={closeServiceModal}
                onFindSpecialists={handleFindSpecialists} 
            />

            {/* 🔑 RENDER Service Selection Modal */}
            <ServiceSelectionModal
                doctor={selectedDoctor}
                specialtyOptions={selectionOptions || []}
                onSelectService={handleSelectSpecialtyFromDoctor}
                // Close selection modal and doctor profile on cancel click
                onClose={() => { closeSelectionModal(); closeDoctorModal(); }} 
            />

            {/* Doctor Profile Modal */}
            <DoctorProfileModal
                doctor={selectedDoctor}
                // Only open the Profile Modal if selectedDoctor is set AND the selection options are NOT visible
                isOpen={!!selectedDoctor && !selectionOptions} 
                // Pass the chosen service for highlighting
                highlightedServiceName={selectedDoctor?.highlightedServiceName}
                onClose={closeDoctorModal}
                // 🔑 FIX: Corrected prop name from onViewServices to onViewSpecialty
                onViewSpecialty={handleViewServiceFromDoctor} 
            />

        </main>
    );
}