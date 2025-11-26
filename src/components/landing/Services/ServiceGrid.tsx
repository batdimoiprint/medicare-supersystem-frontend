// C:\Users\gulfe\Medi\medicare-supersystem-frontend-main\src\components\landing\Services\ServiceGrid.tsx

import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

// --- Image Imports (Placeholder paths based on previous context) ---
import generalDentistryIcon from '@/components/assets/icons/img_general_dentistry.png'; 
import orthodonticsIcon from '@/components/assets/icons/img_orthodontics.png';
import oralSurgeryIcon from '@/components/assets/icons/img_prosthodontics.png';
import prosthodonticsIcon from '@/components/assets/icons/img_radiograph.png';
import cosmeticDentistryIcon from '@/components/assets/icons/img_retainers.png';


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

const SERVICES: ServiceType[] = [
    {
        id: "general-dentistry",
        name: "General Dentistry",
        description: "Routine check-ups, cleanings, and essential maintenance for optimal oral health.",
        image: generalDentistryIcon,
    },
    {
        id: "orthodontics",
        name: "Orthodontics",
        description: "Aligning teeth and correcting jaw problems for a beautiful, functional bite.",
        image: orthodonticsIcon,
    },
    {
        id: "oral-surgery",
        name: "Oral Surgery",
        description: "Specialized surgical procedures including extractions, implants, and biopsies.",
        image: oralSurgeryIcon,
    },
    {
        id: "prosthodontics",
        name: "Prosthodontics",
        description: "Restoring lost or damaged teeth with crowns, bridges, and full-mouth reconstruction.",
        image: prosthodonticsIcon,
    },
    {
        id: "cosmetic-dentistry",
        name: "Cosmetic Dentistry",
        description: "Enhance your smile's beauty through aesthetic treatments like whitening and veneers.",
        image: cosmeticDentistryIcon,
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
                // 🔑 FIX: Use motion.a instead of a as={motion.a} to fix the prop error
                <motion.a
                    key={service.id}
                    href="#" // Use href="#" or dynamic link structure
                    variants={item}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent default link navigation
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