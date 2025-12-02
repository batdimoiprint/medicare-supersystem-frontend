import BlurText from "@/components/ui/BlurText"; // We need this now
import { Briefcase } from 'lucide-react'; // Example Icon

// --- Content Component Definition (Inlined for simplicity) ---
function TermsContent() {
    return (
        <div className="text-muted-foreground space-y-8">
            <p className="text-sm italic text-foreground/70">
                Effective Date: November 26, 2025
            </p>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Briefcase className="w-6 h-6"/> 1. Acceptance of Terms</h2>
                <p>
                    By accessing or using the services provided by Medicare Super System, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Briefcase className="w-6 h-6"/> 2. Medical Disclaimer</h2>
                <p>
                    **The information provided by the Service is not medical advice.** It is for informational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified health provider with any questions you may have regarding a medical condition.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Briefcase className="w-6 h-6"/> 3. User Obligations</h2>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>You must be at least 18 years old to use the appointment booking services.</li>
                    <li>You agree to provide accurate and complete information when booking an appointment or using the contact form.</li>
                    <li>You are responsible for maintaining the confidentiality of your account password.</li>
                </ul>
            </section>
            
            <p className="pt-6">
                For any questions regarding these terms, please contact us via our Support page.
            </p>
        </div>
    );
}
// -----------------------------------------------------------


export default function TermsPage() {
    const title = "Terms of Service";
    const subtitle = "Governing your use of Medicare Super System";
    
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
                <TermsContent />
            </div>
        </main>
    );
}
