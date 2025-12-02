import BlurText from "@/components/ui/BlurText"; // We need this now
import { ChevronDown, HelpCircle } from 'lucide-react'; // Example Icons

// --- Content Component Definition (Inlined for simplicity) ---
const FAQ_ITEMS = [
    {
        question: "How do I book an appointment?",
        answer: "You can book an appointment directly through the 'Services Offered' page by selecting a specialty and a doctor. New patients must register first.",
    },
    {
        question: "What are your clinic hours?",
        answer: "Our main clinic hours are Monday to Friday, 8:00 AM - 5:00 PM, and Saturday, 9:00 AM - 1:00 PM. We are closed on Sundays and national holidays.",
    },
    {
        question: "Which insurance plans do you accept?",
        answer: "We accept most major HMOs and local Philippine health cards. Please contact our hotline at (+63 2) 8123 4567 before your visit to verify your specific coverage.",
    },
    {
        question: "Can I view my past medical records online?",
        answer: "Yes, registered patients can securely access their appointment history, lab results, and physician summaries via the Patient Portal after logging in.",
    },
];

function SupportContent() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6"/> Frequently Asked Questions</h2>
            
            <div className="space-y-4">
                {FAQ_ITEMS.map((item, index) => (
                    <div 
                        key={index} 
                        className="border border-border rounded-lg overflow-hidden transition-all duration-300"
                    >
                        <button 
                            className="flex justify-between items-center w-full p-4 text-left font-semibold text-foreground bg-card hover:bg-card/80 transition-colors"
                        >
                            {item.question}
                            <ChevronDown className="w-5 h-5 text-primary transform transition-transform duration-300" />
                        </button>

                        <div 
                            className="p-4 pt-0 text-muted-foreground border-t border-border bg-background"
                        >
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 text-center">
                <h3 className="text-xl font-bold text-foreground mb-3">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                    If your question is not answered, please contact us directly.
                </p>
                <a 
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                    Go to Contact Page
                </a>
            </div>
        </div>
    );
}
// -----------------------------------------------------------


export default function SupportPage() {
    const title = "Support Center & FAQ";
    const subtitle = "Quick answers to your common questions";
    
    return (
        <main className="bg-background min-h-screen">
            
            {/* START: Inlined Hero Section */}
            <div className="group relative w-full py-16 md:py-20 text-center overflow-hidden">
                <div 
                    className="absolute inset-0 z-0" 
                    style={{
                        background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 10%, var(--color-background) 70%)',
                    }}
                >
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(to bottom, var(--color-background) 0%, transparent 20%, transparent 80%, var(--color-background) 100%)',
                        }}
                    ></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
                    <BlurText 
                        text={title} 
                        delay={100} 
                        className="text-lg md:text-xl font-semibold uppercase tracking-widest text-primary/80" 
                    />
                    
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-primary">
                        {subtitle}
                    </h1>
                </div>
            </div>
            {/* END: Inlined Hero Section */}

            <div className="container mx-auto px-4 py-16 md:py-20 max-w-4xl">
                <SupportContent />
            </div>
        </main>
    );
}
