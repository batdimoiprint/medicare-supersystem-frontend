// components/landing/AboutUs/AboutUsPhilosophy.tsx

import PhilosophyList from "./PhilosophyList";
import imgAboutUsPhilosophy from "../../assets/img_aboutusimg.jpg"; // Your imported image

export default function AboutUsPhilosophy() {
    // Get the URL path safely, using a robust check
    const imageSource = (imgAboutUsPhilosophy as any).default || imgAboutUsPhilosophy;

    return (
        <div className="group py-16 max-w-6xl mx-auto px-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Column: Image with Circular Flashlight Effect */}
                <div className="w-full h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl shadow-primary/10 relative">
                    
                    {/* Image itself (Grayscale and subtle zoom on hover) */}
                    <img
                        // 🔑 FIX 1: Safely access the image string URL using the resolved variable
                        src={imageSource} 
                        alt="Image illustrating gentle dental care or modern technology"
                        className={`w-full h-full object-cover 
                                   filter grayscale transition-all duration-500 ease-in-out 
                                   group-hover:filter-none group-hover:scale-[1.05]`} 
                    />

                    {/* 2. Widening Circular Flashlight Overlay */}
                    <div 
                        className={`absolute inset-0 z-10 w-full h-full 
                                   opacity-0 transition-all duration-700 ease-in-out 
                                   scale-[0.5] group-hover:opacity-100 group-hover:scale-[1.5] rounded-full`}
                        style={{
                            background: 'radial-gradient(at center, rgba(255, 255, 255, 0.4) 10%, transparent 60%)',
                            transform: 'translate(-50%, -50%) scale(0.5)',
                            top: '50%',
                            left: '50%',
                        }}
                    /> 
                    
                </div>

                {/* Right Column: Our Philosophy Text and List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-foreground border-b pb-2 border-border inline-block">
                        Our Guiding Philosophy
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        We go beyond just treating teeth — we care for people. Our approach focuses on
                        long-term health and patient comfort, combining modern technology with a gentle,
                        empathetic touch. We believe that a confident smile starts with comprehensive care
                        and a trusting relationship.
                    </p>
                    {/* PhilosophyList contains the bullet points */}
                    <PhilosophyList />
                </div>
            </div>
        </div>
    );
}