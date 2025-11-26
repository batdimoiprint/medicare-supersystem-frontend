// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\landing\contact\ContactHero.tsx

import BlurText from "@/components/ui/BlurText";

export default function ContactHero() {
    return (
        // Hero container with consistent styling (similar to DentistHeader)
        <div className="group relative w-full py-16 md:py-20 text-center overflow-hidden">
            
            {/* Background Container - Seamless Radial Gradient (Consistent with other heroes) */}
            <div 
                className="absolute inset-0 z-0" 
                style={{
                    // Softened radial gradient for the center glow
                    background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 10%, var(--color-background) 70%)',
                }}
            >
                {/* Linear gradient for the seamless bottom and top fade */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, var(--color-background) 0%, transparent 20%, transparent 80%, var(--color-background) 100%)',
                    }}
                ></div>
            </div>

            {/* Content overlaid on the background */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
                
                <BlurText 
                    text="Contact & Location" // Sub-heading
                    delay={100} 
                    className="text-lg md:text-xl font-semibold uppercase tracking-widest text-primary/80" 
                />
                
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-primary">
                    We’re Here to <br className="hidden md:inline"/> Answer Your Questions.
                </h1>
                
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Whether you need to book an appointment, inquire about our services, or find our clinic, 
                    you can reach us through the form or the details below.
                </p>
            </div>
        </div>
    );
}