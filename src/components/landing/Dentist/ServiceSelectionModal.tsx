// C:\path\to\ServiceSelectionModal.tsx

import { type Dentist } from '@/components/landing/Dentist/DentistList';
import { useEffect } from 'react';
// Import scroll utilities from ServiceModal
import { applyScrollLock, removeScrollLock } from '@/components/landing/Services/ServiceModal'; 


type ServiceSelectionModalProps = {
    doctor: Dentist | null;
    specialtyOptions: string[]; // e.g., ["Orthodontics", "Cosmetic Dentistry"]
    onSelectService: (specialtyName: string) => void;
    onClose: () => void;
};

export default function ServiceSelectionModal({ 
    doctor, 
    specialtyOptions, 
    onSelectService, 
    onClose 
}: ServiceSelectionModalProps) {
    const isOpen = !!doctor && specialtyOptions.length >= 2;
    if (!isOpen) return null;

    // Apply scroll locking
    useEffect(() => {
        applyScrollLock();
        return () => {
            removeScrollLock();
        };
    }, [isOpen]);

    return (
        // Backdrop
        <div 
            className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70"
            onClick={onClose}
        >
            <div 
                className="bg-card p-8 rounded-lg max-w-sm w-full text-center shadow-2xl"
                 onClick={(e) => e.stopPropagation()} // Stop click from closing modal
            >
                
                <h3 className="text-xl font-bold mb-4">
                    Select Service for {doctor!.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                    Dr. {doctor!.name.split(' ').pop()} offers multiple specialties. Please choose one to view the full service details.
                </p>

                {specialtyOptions.map((specialty) => (
                    <button 
                        key={specialty}
                        onClick={() => onSelectService(specialty)}
                        className="w-full mb-3 inline-flex items-center justify-center rounded-lg h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        View {specialty} Services
                    </button>
                ))}
                
                <button 
                    onClick={onClose}
                    className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}