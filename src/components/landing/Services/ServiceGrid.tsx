import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

// --- Image Imports (Renamed Aliases for clarity based on the new service names) ---
import generalDentistryIcon from '@/components/assets/icons/img_general_dentistry.png'; 
import orthodonticsIcon from '@/components/assets/icons/img_orthodontics.png';
import prosthodonticsIcon from '@/components/assets/icons/img_prosthodontics.png'; // Now Prosthodontics
import radiographIcon from '@/components/assets/icons/img_radiograph.png';       // Now Radiograph
import cosmeticDentistryIcon from '@/components/assets/icons/img_retainers.png';

// Import Example Images for Modals (Matching the new names)
import exampleGeneralDentistry from '@/components/assets/modals/example_general_dentistry.jpg';
import exampleOrthodontics from '@/components/assets/modals/example_orthodontics.jpg';
import exampleProsthodontics from '@/components/assets/modals/example_prosthodontics.jpg'; // Now Prosthodontics Example
import exampleRadiograph from '@/components/assets/modals/example_radiograph.jpg';         // Now Radiograph Example
import exampleCosmeticDentistry from '@/components/assets/modals/example_retainers.jpg';


// Export ServiceType so it can be used in ServicesPage.tsx and ServiceModal.tsx
export type ServiceType = {
    id: string;
    name: string;
    description: string;
    image: string; // Icon image for the card
    longDescription?: string;
    exampleImage?: string; // Larger visual image for the modal
    subServices?: string[];
};

// 🔑 FIX: Export the SERVICES array so it can be imported and used for modal lookups in ServicesPage.tsx
export const SERVICES: ServiceType[] = [
    {
        id: "general-dentistry",
        name: "General Dentistry",
        description: "Routine check-ups, cleanings, and essential maintenance for optimal oral health.",
        image: generalDentistryIcon,
        longDescription:
            "General dentistry forms the foundation of excellent oral health. It involves preventive care and the diagnosis and treatment of common dental issues. We focus on helping you maintain a healthy smile for life through regular maintenance and early intervention.",
        exampleImage: exampleGeneralDentistry,
        subServices: ["Dental Check-ups", "Professional Cleanings", "Fillings and Restorations", "Root Canal Therapy", "Preventive Education"],
    },
    {
        id: "orthodontics",
        name: "Orthodontics",
        description: "Aligning teeth and correcting jaw problems for a beautiful, functional bite.",
        image: orthodonticsIcon,
        longDescription:
            "Orthodontics is the branch of dentistry dealing with the correction of teeth and jaws that are positioned improperly. This treatment not only improves the aesthetics of your smile but also ensures a correct bite, leading to better long-term oral health and function.",
        exampleImage: exampleOrthodontics,
        subServices: ["Traditional Braces", "Clear Aligners (e.g., Invisalign)", "Retainers", "Interceptive Orthodontics (Children)", "Corrective Jaw Surgery Consultations"],
    },
    {
        // --- CHANGED: Oral Surgery -> Prosthodontics ---
        id: "prosthodontics", // Updated ID
        name: "Prosthodontics", // Updated Name
        description: "Expert restoration of lost or damaged teeth using crowns, bridges, and full-mouth reconstruction.", // Updated description
        image: prosthodonticsIcon, // Using the original Oral Surgery icon path, but aliased as prosthodonticsIcon
        longDescription:
            "Prosthodontics is the area of dentistry focusing on the design, manufacture, and fitting of artificial replacements for missing or damaged teeth, or other oral structures. Specialists in this field restore optimal function and appearance using high-quality prosthetics.", // Updated long description
        exampleImage: exampleProsthodontics, // Using the original Oral Surgery example path, but aliased as exampleProsthodontics
        subServices: ["Dental Crowns", "Dental Bridges", "Dentures (Full and Partial)", "Veneers and Inlays", "Implant-Supported Prosthetics"], // Keeping original Oral Surgery services OR updating with Prosthodontics services
    },
    {
        // --- CHANGED: Prosthodontics -> Radiograph ---
        id: "radiograph", // Updated ID
        name: "Radiograph", // Updated Name
        description: "Advanced diagnostic imaging and digital X-ray services for precise treatment planning.", // Updated description
        image: radiographIcon, // Using the original Prosthodontics icon path, but aliased as radiographIcon
        longDescription:
            "Radiography, or dental X-rays, provides essential internal views of your teeth, bones, and soft tissues. This diagnostic tool is crucial for detecting problems not visible during a clinical examination, ensuring accurate diagnosis and customized treatment plans.", // Updated long description
        exampleImage: exampleRadiograph, // Using the original Prosthodontics example path, but aliased as exampleRadiograph
        subServices: ["Digital X-rays", "Panoramic X-rays", "Cone-Beam CT (CBCT) Scans", "Intraoral Imaging", "Diagnostic Reports"], // Updated sub-services to be relevant to Radiograph
    },
    {
        id: "cosmetic-dentistry",
        name: "Cosmetic Dentistry",
        description: "Enhance your smile's beauty through aesthetic treatments like whitening and veneers.",
        image: cosmeticDentistryIcon,
        longDescription:
            "Cosmetic dentistry focuses on improving the appearance of your teeth, gums, and bite. From minor changes to major repairs, we use advanced techniques and materials to give you a brighter, more confident smile that harmonizes with your facial features.",
        exampleImage: exampleCosmeticDentistry,
        subServices: ["Teeth Whitening", "Porcelain Veneers", "Gum Contouring", "Tooth Bonding", "Smile Makeovers"],
    },
];

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

type ServiceGridProps = {
    onServiceClick: (service: ServiceType) => void;
};


export default function ServiceGrid({ onServiceClick }: ServiceGridProps) {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
        >
            {SERVICES.map((service) => (
                // 🔑 This part correctly calls onServiceClick, which triggers the modal in the parent.
                <motion.a
                    key={service.id}
                    href="#" 
                    variants={item}
                    onClick={(e) => {
                        e.preventDefault(); 
                        onServiceClick(service);
                    }}
                    className={cn(
                        "group p-8 rounded-xl border border-border/70 bg-card shadow-lg",
                        "flex flex-col items-start space-y-4 cursor-pointer",
                        "hover:border-primary/50 hover:bg-card/90 transition-all duration-300 ease-in-out",
                        "hover:shadow-primary/20 hover:shadow-2xl"
                    )}
                >
                    {/* Icon */}
                    <div className="p-3 rounded-full bg-primary/15 mb-2 transition-transform duration-300 group-hover:scale-105">
                        <img 
                            src={service.image} 
                            alt={`${service.name} Icon`} 
                            className="w-8 h-8 object-contain text-primary" 
                        />
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground flex-grow">
                        {service.description}
                    </p>

                    {/* Learn More Link (Visual element) */}
                    <div className="flex items-center text-primary font-semibold mt-4">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                </motion.a>
            ))}
        </motion.div>
    );
}