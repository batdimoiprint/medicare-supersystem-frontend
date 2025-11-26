// components/landing/AboutUs/PhilosophyList.tsx

// Assuming you have a component for an icon, e.g., from Lucide or a custom file:
// import { CheckCheck } from "lucide-react"; 
// OR a custom wrapper, which is what I'll simulate for cleanliness.

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);


const philosophyItems = [
    {
        title: "Personalized Care",
        description: "Every patient has unique needs; treatments are tailored to your lifestyle and goals.",
    },
    {
        title: "Modern Technology",
        description: "From digital X‑rays to advanced procedures, we use safe and efficient tools to deliver the best results.",
    },
    {
        title: "Gentle Dentistry",
        description: "Comfort and empathy are core to how we treat every patient — we prioritize pain management and clear communication.",
    },
    // Adding one more point for better list length balance with the image
    {
        title: "Long-Term Health Focus",
        description: "We focus on preventative maintenance, empowering you with knowledge for lasting oral wellness.",
    },
];

export default function PhilosophyList() {
    return (
        <ul className="space-y-4 pt-4">
            {philosophyItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                    {/* Use the CheckIcon component here */}
                    <CheckIcon className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{item.title}:</strong> {item.description}
                    </p>
                </li>
            ))}
        </ul>
    );
}