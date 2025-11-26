// C:\Users\gulfe\Medi\medicare-supersystem-frontend\src\components\landing\Dentist\DentistHeader.tsx

export default function DentistHeader() {
    const subtitle = "Experience Guided by Compassionate Expertise.";
    
    return (
        <div className="group relative w-full py-16 md:py-20 text-center overflow-hidden">
            
            {/* Background Container - Seamless Radial Gradient */}
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

            {/* Content overlaid on the background */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
                
                <p className="text-lg md:text-xl font-semibold uppercase tracking-widest text-primary/80">
                    Meet Our Team
                </p>
                
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-primary">
                    {subtitle}
                </h1>
                
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Our dedicated team of licensed dental professionals provides comprehensive, specialized care. Each specialist is dedicated to your long-term wellness.
                </p>
            </div>
        </div>
    );
}