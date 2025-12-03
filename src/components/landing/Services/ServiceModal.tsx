// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\landing\Services\ServiceModal.tsx

import { type ServiceType } from '@/components/landing/Services/ServiceGrid'; 
import { useEffect } from 'react';

// 🔑 FIX 1: Shared counter to track how many modals are currently open
let modalLockCount = 0; 

// 🔑 FIX 2: Functions to apply and remove the lock robustly 
// These functions MUST be explicitly exported for use by other modals/pages.
export function applyScrollLock() {
    modalLockCount++;
    // Only set overflow: hidden if this is the first modal opening
    if (modalLockCount === 1) {
        document.body.style.overflow = 'hidden';
    }
}

export function removeScrollLock() {
    // Decrement counter, ensuring it doesn't drop below zero
    modalLockCount = Math.max(0, modalLockCount - 1);
    
    // Only reset overflow if the last modal has closed
    if (modalLockCount === 0) { 
        document.body.style.overflow = '';
    }
}

// 🔑 FINAL FIX: Function to bypass the counter and force the scroll unlock (The ultimate guarantee)
export function forceRemoveScrollLock() {
    modalLockCount = 0; // Reset the counter completely
    document.body.style.overflow = ''; // Force scroll back
}


type ServiceModalProps = {
    service: ServiceType | null; 
    onClose: () => void;
    onFindSpecialists: (specialtyName: string) => void; 
};

export default function ServiceModal({ service, onClose, onFindSpecialists }: ServiceModalProps) {
    const isOpen = !!service;
    if (!isOpen || !service) return null;

    const subServicesList = service.subServices || [];
    
    // 🔑 FIX 3: Use the robust scroll locking logic in useEffect
    useEffect(() => {
        if (isOpen) {
            applyScrollLock();
        } 

        // Cleanup runs when the modal is unmounted/closed
        return () => {
            removeScrollLock();
        };
    }, [isOpen]); 

    // Function to close the modal and trigger the external handler
    const handleFindSpecialists = () => {
        const specialtyName = service.name;
        
        // 1. Close the current Service Modal
        onClose(); 
        
        // 2. Call the external function which will find the specialist and open the Doctor Modal
        onFindSpecialists(specialtyName);
    };

    return (
        // 1. Custom Backdrop/Overlay (Click outside to close)
        <div 
            className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/60 transition-opacity duration-300"
            onClick={onClose} 
        >
            {/* 2. Modal Content Container (Flex Column) */}
            <div 
                className="bg-card text-foreground rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl 
                           transform transition-transform duration-300 scale-100 flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()} // Stop propagation so clicking inside doesn't close
            >
                
                {/* 3. Modal Header (Fixed height) */}
                <div id="modal-title" className="px-8 py-10 bg-gradient-to-br from-primary/10 to-background border-b border-border/50 text-center flex-shrink-0">
                    <div className="p-3 w-fit rounded-full bg-primary/15 mb-4 mx-auto">
                        <img 
                            src={service.image} 
                            alt={service.name} 
                            className="w-10 h-10 object-contain text-primary" 
                        />
                    </div>
                    
                    <h2 className="text-4xl font-extrabold text-foreground mb-2">
                        {service.name}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {service.description}
                    </p>
                </div>

                {/* 4. Modal Body (SCROLLABLE SECTION) */}
                <div className="flex-grow overflow-y-auto">
                    <div className="p-8 space-y-8 pb-8"> 
                        
                        {/* Example Image Section (1x1 Square) */}
              {service.exampleImage && (
                            <section className="space-y-4">
                                <h3 className="text-2xl font-bold text-foreground">Visual Example</h3>
                                <div className="relative w-full rounded-lg border border-border/50 shadow-md overflow-hidden pt-[100%]">
                                    <img 
                                        src={service.exampleImage} 
                                        alt={`${service.name} Example`} 
                                        className="absolute top-0 left-0 w-full h-full object-cover" 
                                    />
                                </div>
                            </section>
                        )}

                        {/* Long Description */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-foreground">About This Service</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {service.longDescription}
                            </p>
                        </section>

                        {/* Sub-Services (Key Procedures & Treatments) */}
                        {subServicesList.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-2xl font-bold text-foreground">Key Procedures & Treatments</h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-foreground">
                                    {subServicesList.map((sub: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 text-lg font-medium">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            {sub}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>

                {/* 5. Footer CTA (Fixed height) */}
                <div className="bg-card border-t border-border/70 p-6 flex justify-end flex-shrink-0">
                    <button 
                        onClick={handleFindSpecialists} 
                        className="inline-flex items-center justify-center rounded-lg text-lg font-bold transition-colors h-12 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                        Find {service.name} Specialists
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}