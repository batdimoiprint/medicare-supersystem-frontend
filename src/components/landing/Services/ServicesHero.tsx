// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\services\ServicesHero.tsx

import BlurText from "@/components/ui/BlurText";

export default function ServicesHero() {
    const title = "Our Medical Services";
    const subtitle = "Comprehensive Care Across All Specialties";
    
    return (
        <div className="group relative w-full py-16 md:py-20 text-center overflow-hidden">
            
            {/* START: Hero Background */}
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
            {/* END: Hero Background */}

            <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
                <BlurText 
                    text={title} 
                    delay={100} 
                    className="text-lg md:text-xl font-semibold uppercase tracking-widest text-primary/80" 
                />
                
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-primary">
                    {subtitle}
                </h1>

                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    From preventative check-ups to specialized surgical care, our network of experts provides world-class treatment tailored to your needs.
                </p>
            </div>
        </div>
    );
}