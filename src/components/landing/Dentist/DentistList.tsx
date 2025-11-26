// C:\Users\gulfe\Medi\medicare-supersystem-frontend-main\src\components\landing\Dentist\DentistList.tsx

import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion"; 
import { GraduationCap } from "lucide-react"; 
import { useState } from 'react';
import DoctorProfileModal from './DoctorProfileModal';

// --- IMAGE IMPORTS (assuming correct alias path) ---
import imgMaria from '@/components/assets/dentists/img_dentist1.jpg';
import imgJohn from '@/components/assets/dentists/img_dentist2.jpg';
import imgAngela from '@/components/assets/dentists/img_dentist3.jpg';
import imgMark from '@/components/assets/dentists/img_dentist4.jpg';


// --- TYPE AND DATA EXPORTS ---

export type Dentist = {
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

export const DENTISTS: Dentist[] = [
  {
    id: "maria-santos",
    name: "Dr. Maria Santos",
    specialization: "General Dentistry, Pediatric Focus",
    education: "UE College of Dentistry (2016–2021)",
    image: imgMaria, 
    bio: "Dr. Santos is known for her gentle approach, specializing in making dental visits comfortable and enjoyable for children and anxious patients.",
    years: 4,
    philosophy: "A healthy smile starts young. Focuses on preventative care and patient education, ensuring children and anxious adults feel safe.",
    affiliations: "Philippine Dental Association (PDA), Philippine Society of Pediatric Dentistry",
    services: ["Routine Cleanings", "Sealants", "Fluoride Treatments", "Simple Extractions", "Fillings", "Comprehensive Pediatric Exams"],
  },
  {
    id: "john-dela-cruz",
    name: "Dr. John Dela Cruz",
    specialization: "Orthodontics & Cosmetic Dentistry",
    education: "University of the East, 2018",
    image: imgJohn,
    bio: "With advanced training in clear aligner technology and smile design, Dr. Dela Cruz transforms smiles using the latest aesthetic techniques.",
    years: 7,
    philosophy: "Designing confidence, one tooth at a time. Specializes in achieving natural, balanced results using digital smile design (DSD).",
    affiliations: "Philippine Orthodontic Society, Philippine Academy of Esthetic Dentistry",
    services: ["Clear Aligners (Invisalign)", "Traditional Braces", "Porcelain Veneers", "Teeth Whitening", "Gum Contouring", "Smile Makeovers"],
  },
  {
    id: "angela-reyes",
    name: "Dr. Angela Reyes",
    specialization: "Oral Surgery & Endodontics",
    education: "University of the Philippines Manila",
    image: imgAngela,
    bio: "A precision-focused surgeon, Dr. Reyes excels in complex procedures, from wisdom tooth extraction to root canal therapy, ensuring quick recovery.",
    years: 10,
    philosophy: "Precision and comfort are not mutually exclusive. Prioritizes rapid post-operative recovery for complex procedures.",
    affiliations: "Philippine Society of Endodontists, Association of Philippine Oral and Maxillofacial Surgeons",
    services: ["Root Canal Therapy", "Wisdom Tooth Extraction", "Dental Implant Placement", "Apicoectomy", "Biopsies"],
  },
  {
    id: "mark-villanueva",
    name: "Dr. Mark Villanueva",
    specialization: "Prosthodontics & Digital Imaging",
    education: "CEU Manila, College of Dentistry",
    image: imgMark,
    bio: "Dr. Villanueva specializes in restoring function and aesthetics with crowns, bridges, and implants, leveraging advanced 3D scanning technology.",
    years: 6,
    philosophy: "Function restored is life restored. Utilizes digital tools (CAD/CAM) to create perfectly fitting, durable, and aesthetic restorations.",
    affiliations: "Philippine Prosthodontic Society, International Team for Implantology (ITI)",
    services: ["Dental Implants (Restorative Phase)", "Crowns", "Bridges", "Full and Partial Dentures", "Occlusal Adjustments", "Full-Mouth Reconstruction"],
  },
];


// --- ANIMATION VARIANTS ---

const container: Variants = { 
    hidden: {},
    show: {
        transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeInOut",
        },
    },
};

// --- COMPONENT PROPS ---

type DentistListProps = {
    initialSpecialtyFilter?: string; 
    onCloseProfiles?: () => void;
    // Required prop for the modal chain
    onViewServices?: (specialtyName: string) => void; 
};


// --- MAIN COMPONENT ---

export default function DentistList({ initialSpecialtyFilter, onCloseProfiles, onViewServices }: DentistListProps) {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Dentist | null>(null);
    const [currentFilter, setCurrentFilter] = useState(initialSpecialtyFilter || ''); // State for filter

    const openModal = (doctor: Dentist) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDoctor(null);
    };

    // Filtering Logic based on prop
    const filteredDentists = DENTISTS.filter(doc => {
        if (!currentFilter) return true;

        const specialtyParts = doc.specialization.split(',').map(s => s.trim().toLowerCase());
        const targetFilter = currentFilter.toLowerCase().replace(/-/g, ' ');

        return specialtyParts.some(part => part.includes(targetFilter));
    });

    return (
        <>
            {/* --- Filter Display --- */}
            {currentFilter && (
                <div className="max-w-6xl mx-auto p-4 bg-primary/10 rounded-lg text-center my-6">
                    <p className="text-xl font-semibold text-primary">
                        Showing results for: <span className="capitalize">{currentFilter.replace(/-/g, ' ')}</span>
                    </p>
                    <button 
                        onClick={() => setCurrentFilter('')}
                        className="mt-2 text-sm text-muted-foreground hover:text-foreground underline"
                    >
                        Clear Filter
                    </button>
                </div>
            )}
            
            {filteredDentists.length === 0 && currentFilter && (
                <div className="max-w-6xl mx-auto p-8 text-center my-16 bg-card rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-red-500">No Specialists Found</h3>
                    <p className="text-muted-foreground mt-2">
                        We couldn't find any doctors matching the specialty: <strong className="capitalize">{currentFilter.replace(/-/g, ' ')}</strong>. Showing all available doctors below.
                    </p>
                </div>
            )}

            <motion.div
                className="mt-16 space-y-12 max-w-6xl mx-auto"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
            >
                {filteredDentists.map((doc, idx) => {
                    const isReverse = idx % 2 === 1;
                    return (
                        <motion.article
                            key={doc.id}
                            variants={item}
                            className={cn(
                                "group relative flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl",
                                "overflow-hidden isolate transition-all duration-300 ease-in-out transition-colors", 
                                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:via-primary/5 before:to-transparent",
                                "before:opacity-0 before:scale-50 before:rounded-full before:transition-all before:duration-500 before:ease-out",
                                
                                "hover:bg-card", 
                                "hover:shadow-xl hover:shadow-primary/20", 
                                "hover:before:opacity-100 hover:before:scale-125",
                                isReverse ? "md:flex-row-reverse" : "md:flex-row"
                            )}
                        >
                            
                            {/* Image (Circular Avatar) */}
                            <div 
                                className={cn(
                                    "flex-shrink-0 relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden", 
                                    "shadow-md transition-transform duration-300",
                                    "hover:scale-[1.02]", 
                                )}
                            >
                                <img
                                    // FIX: Safely access the image source property
                                    src={typeof doc.image === 'string' ? doc.image : doc.image?.src}
                                    alt={doc.name}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23223038'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%2366b3ff'%3EDr. Photo%3C/text%3E%3C/svg%3E";
                                    }}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Text Content */}
                            <div className="relative z-10 flex-1 min-w-0 space-y-3 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-foreground">
                                    {doc.name}
                                </h3>
                                
                                {/* Specialization (Highlighted in Primary Color) */}
                                <p className="text-lg font-semibold text-primary/90 mt-1">
                                    {doc.specialization}
                                </p>

                                <div className="h-0.5 w-16 bg-muted-foreground/30 mx-auto md:mx-0 pt-2"></div>
                                
                                <p className="text-base text-muted-foreground pt-1">
                                    {doc.bio}
                                </p>

                                <ul className="mt-4 text-sm text-muted-foreground list-none space-y-2">
                                    <li className="flex items-center gap-3">
                                        <GraduationCap className="w-5 h-5 text-primary/80 flex-shrink-0" />
                                        <strong className="font-medium">{doc.education}</strong>
                                    </li>
                                </ul>

                                <button 
                                    onClick={() => openModal(doc)}
                                    className="mt-5 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                >
                                    View Full Profile
                                </button>
                            </div>
                        </motion.article>
                    );
                })}
            </motion.div>

            {/* Render the 'Close Profiles' button only if the prop is provided (i.e., on the dedicated Doctor Page) */}
            {onCloseProfiles && (
                <div className="mt-16 text-center">
                    <button
                        onClick={onCloseProfiles} 
                        className="inline-flex items-center justify-center rounded-lg text-lg font-bold transition-colors h-12 px-8 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
                    >
                        Go Back to Services
                    </button>
                </div>
            )}


            {/* 5. Render the Modal component */}
            <DoctorProfileModal 
                doctor={selectedDoctor} 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                onViewServices={onViewServices || (() => console.log('View Services link clicked'))}
            />
        </>
    );
}