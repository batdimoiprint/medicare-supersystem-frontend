import BlurText from "@/components/ui/BlurText"; // We need this now
import { Shield } from 'lucide-react'; // Example Icon

// --- Content Component Definition (Inlined for simplicity) ---
function PrivacyContent() {
    return (
        <div className="text-muted-foreground space-y-8">
            <p className="text-sm italic text-foreground/70">
                Last Updated: November 26, 2025
            </p>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Shield className="w-6 h-6"/> 1. Information We Collect</h2>
                <p>
                    We collect personal information that you voluntarily provide to us when registering for services or making inquiries. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>**Personal Identification Data:** Name, date of birth, and contact information (email, phone, address).</li>
                    <li>**Health Information:** Appointment history and physician notes (stored securely and encrypted).</li>
                    <li>**Technical Data:** IP address, browser type, and usage data via cookies.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Shield className="w-6 h-6"/> 2. How We Use Your Information</h2>
                <p>
                    Your information is used to: **provide and maintain our services**, process transactions, manage your account, and communicate with you about your appointments and health records.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-3xl font-bold text-primary mb-4 flex items-center gap-2"><Shield className="w-6 h-6"/> 3. Data Security</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. All health data is handled in compliance with applicable health privacy laws.
                </p>
            </section>
        </div>
    );
}
// -----------------------------------------------------------


export default function PrivacyPage() {
    const title = "Privacy Policy";
    const subtitle = "How we protect your health and personal information";
    
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
                <PrivacyContent />
            </div>
        </main>
    );
}
