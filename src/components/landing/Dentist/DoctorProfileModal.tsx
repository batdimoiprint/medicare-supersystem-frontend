// C:\Users\gulfe\Medi\medicare-supersystem-frontend\src\components\landing\Dentist\DoctorProfileModal.tsx

import { Briefcase, GraduationCap, Heart, BookOpen, X } from 'lucide-react';
import { useEffect } from 'react'; 
// 🔑 FIX 1: Import the scroll lock utility functions from the Service Modal file
import { applyScrollLock, removeScrollLock } from '@/components/landing/Services/ServiceModal'; 


// 🔑 FIX 2: Define the Doctor type for use within this module (assuming it's not universally imported)
type Doctor = {
    id: string;
    name: string;
    specialization: string;
    education: string;
    image?: { src: string } | string;
    bio?: string;
    years: number;
    philosophy: string;
    affiliations: string;
    services: string[];
};

type DoctorProfileModalProps = {
    doctor: Doctor | null;
    isOpen: boolean;
    onClose: () => void;
    // 🔑 CORRECTED PROP: onViewSpecialty is the correct handler name for this modal
    onViewSpecialty: (specialization: string) => void; 
    // 🔑 PROP: Used to link the CTA correctly after selection from ServiceSelectionModal
    highlightedServiceName?: string; 
};

// Placeholder data (MUST match DENTISTS data for lookup)
const DETAILED_PROFILES: { [key: string]: Omit<Doctor, 'id' | 'image' | 'bio' | 'name' | 'specialization' | 'education'> } = {
    'maria-santos': { 
        years: 4, 
        philosophy: "A healthy smile starts young. Focuses on preventative care and patient education, ensuring children and anxious adults feel safe.", 
        affiliations: "Philippine Dental Association (PDA), Philippine Society of Pediatric Dentistry", 
        services: ["Routine Cleanings", "Sealants", "Fluoride Treatments", "Simple Extractions", "Fillings", "Comprehensive Pediatric Exams"] 
    },
    'john-dela-cruz': { 
        years: 7, 
        philosophy: "Designing confidence, one tooth at a time. Specializes in achieving natural, balanced results using digital smile design (DSD).", 
        affiliations: "Philippine Orthodontic Society, Philippine Academy of Esthetic Dentistry", 
        services: ["Clear Aligners (Invisalign)", "Traditional Braces", "Porcelain Veneers", "Teeth Whitening", "Gum Contouring", "Smile Makeovers"] 
    },
    'angela-reyes': { 
        years: 10, 
        philosophy: "Precision and comfort are not mutually exclusive. Prioritizes rapid post-operative recovery for complex procedures.", 
        affiliations: "Philippine Society of Endodontists, Association of Philippine Oral and Maxillofacial Surgeons", 
        services: ["Root Canal Therapy", "Wisdom Tooth Extraction", "Dental Implant Placement", "Apicoectomy", "Biopsies"] 
    },
    'mark-villanueva': { 
        years: 6, 
        philosophy: "Function restored is life restored. Utilizes digital tools (CAD/CAM) to create perfectly fitting, durable, and aesthetic restorations.", 
        affiliations: "Philippine Prosthodontic Society, International Team for Implantology (ITI)", 
        services: ["Dental Implants (Restorative Phase)", "Crowns", "Bridges", "Full and Partial Dentures", "Occlusal Adjustments", "Full-Mouth Reconstruction"] 
    },
};


export default function DoctorProfileModal({ doctor, isOpen, onClose, onViewSpecialty, highlightedServiceName }: DoctorProfileModalProps) {
    
    // 🔑 FIX 3: Use the robust scroll locking utility on mount/unmount
    useEffect(() => {
        if (isOpen) {
            applyScrollLock();
        } 

        // Cleanup runs when the component unmounts (or isOpen becomes false)
        return () => { 
            removeScrollLock(); 
        };
    }, [isOpen]); 

    if (!isOpen || !doctor) return null;

    // Safely combine doctor data with detailed profile data and image source
    const profile = { 
        ...doctor, 
        ...DETAILED_PROFILES[doctor.id],
        // Safely determine image source string for display
        imageSrc: typeof doctor.image === 'string' 
            ? doctor.image 
            : (doctor.image as { src: string })?.src
    };

    // 🔑 FIX: Determine which specialty name to display on the button and pass to the next modal
    const buttonSpecialtyName = highlightedServiceName 
        ? highlightedServiceName // Use the one selected in the ServiceSelectionModal
        : profile.specialization.split(',')[0].trim(); // Fallback to primary specialization


    // Handler to switch back to Service Modal view
    const handleViewServices = () => {
        // DO NOT close the doctor modal here. The parent (ServicesPage) will handle the modals.
        
        // Pass the full specialization string to the parent (ServicesPage) to handle logic
        onViewSpecialty(profile.specialization); 
    };

    return (
        // Overlay container: Handles click-outside-to-close
        <div 
            className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/60 transition-opacity duration-300"
            onClick={onClose} 
        >
            {/* Modal Content Container (Flex Column) */}
            <div 
                className="bg-card text-foreground rounded-xl w-full max-w-3xl max-h-[90vh] shadow-2xl 
                           transform transition-transform duration-300 scale-100 flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()} // Clicks inside do not close
            >
                
                {/* Modal Header */}
                <div className="bg-card border-b border-border/70 p-6 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 id="modal-title" className="text-3xl font-extrabold text-primary">{profile.name}</h2>
                            <p className="text-lg text-muted-foreground">{profile.specialization}</p>
                        </div>
                        {/* Optional Close Button (for accessibility/visibility check) */}
                        <button onClick={onClose} aria-label="Close profile" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Body: SCROLLABLE SECTION */}
                <div className="flex-grow overflow-y-auto p-6 space-y-8"> 
                    
                    {/* Top Section: Image and Quick Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {profile.imageSrc && (
                            <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                                <img src={profile.imageSrc} alt={`Dr. ${profile.name}`} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="space-y-3 flex-1">
                            <h3 className="text-xl font-bold text-foreground/90">Professional Summary</h3>
                            <p className="text-base text-muted-foreground italic">"{profile.bio}"</p>

                            <ul className="space-y-2 pt-2">
                                <li className="flex items-center gap-3 text-sm text-foreground">
                                    <GraduationCap className="w-4 h-4 text-primary/80" />
                                    Education: <strong className="font-medium">{profile.education}</strong>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-foreground">
                                    <Briefcase className="w-4 h-4 text-primary/80" />
                                    Experience: <strong className="font-medium">{profile.years} Years</strong>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <hr className='border-border/50' />

                    {/* Detailed Philosophy (as in design) */}
                    <div className='space-y-3'>
                        <h3 className="text-xl font-bold text-foreground/90 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/> Clinical Philosophy</h3>
                        <blockquote className="border-l-4 border-primary/70 pl-4 text-muted-foreground text-base">
                            {profile.philosophy}
                        </blockquote>
                    </div>

                    {/* Affiliations & Services (Two Columns) */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Affiliations */}
                        <div className='space-y-3'>
                            <h3 className="text-xl font-bold text-foreground/90 flex items-center gap-2"><Heart className="w-5 h-5 text-primary"/> Professional Affiliations</h3>
                            <p className="text-muted-foreground text-sm">{profile.affiliations}</p>
                        </div>
                        
                        {/* Services */}
                        <div className='space-y-3'>
                            <h3 className="text-xl font-bold text-foreground/90 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/> Key Services</h3>
                            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                                {profile.services.map((service, index) => {
                                    // 🔑 FIX: Highlight the selected service if a name is passed
                                    const isHighlighted = buttonSpecialtyName && service.toLowerCase().includes(buttonSpecialtyName.toLowerCase());
                                    return (
                                        <li 
                                            key={index}
                                            className={isHighlighted ? 'text-primary font-semibold' : ''}
                                        >
                                            {service}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Footer CTA - Dual Buttons */}
                <div className="bg-card border-t border-border/70 p-6 flex justify-between flex-shrink-0">
                    
                    {/* Left Button: View Services */}
                    <button 
                        onClick={handleViewServices} // Trigger modal chain
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-6 py-2 border border-primary/50 text-primary hover:bg-primary/10 shadow-md"
                    >
                        View {buttonSpecialtyName} Services
                    </button>
                    
                    {/* Right Button: Book Appointment */}
                    <a 
                        href="/appointment/book"
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    >
                        Book a Consultation
                    </a>
                </div>
            </div>
        </div>
    );
}