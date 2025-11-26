// components/landing/AboutUs/AboutUsHero.tsx (FINAL FIX: Seamless Bottom Fade)

import BlurText from "@/components/ui/BlurText";

export default function AboutUsHero() {
    return (
        // Hero container is clean and uses standard w-full
        <div className="group relative w-full py-16 md:py-20 text-center overflow-hidden">
            
            {/* Background Container - Seamless Radial Gradient */}
            <div 
                className="absolute inset-0 z-0" 
                style={{
                    // Softened radial gradient for the center glow
                    background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 10%, var(--color-background) 70%)',
                }}
            >
                {/* Linear gradient for the navbar area (top) and the seamless bottom fade */}
                <div 
                    className="absolute inset-0"
                    style={{
                        // Top Fade (0% to 25%): Covers navbar area
                        // Bottom Fade (75% to 100%): Creates a long, gentle fade-out at the bottom
                        background: 'linear-gradient(to bottom, var(--color-background) 0%, var(--color-background) 12%, transparent 25%, transparent 75%, var(--color-background) 100%)',
                    }}
                ></div>
            </div>

            {/* Content overlaid on the background */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
                
                <BlurText 
                    text="Our Story & Vision" 
                    delay={100} 
                    className="text-lg md:text-xl font-semibold uppercase tracking-widest text-primary/80" 
                />
                
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-primary">
                    Building Brighter Smiles, Backed by Compassionate Care and Clinical Excellence.
                </h1>
                
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    At MEDICARE Dental Clinic, we believe every smile tells a story. Founded on the mission of
                    providing quality, affordable, and compassionate dental care, we are a trusted partner
                    for families and individuals who value their oral health.
                </p>

            </div>
        </div>
    );
}