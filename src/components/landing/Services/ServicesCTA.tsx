// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\services\ServicesCTA.tsx

import { CalendarCheck } from 'lucide-react';

export default function ServicesCTA() {
    return (
        <div className="bg-primary/5 py-16 md:py-24 my-16">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-6">
                    <CalendarCheck className="w-12 h-12 text-primary mx-auto"/>
                    <h2 className="text-4xl font-extrabold text-foreground">
                        Ready to Book Your Appointment?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Take the first step towards better health. Our easy-to-use system connects you directly with the right specialist.
                    </p>
                    <a 
                        href="/appointment/step1"
                        className="inline-flex items-center justify-center rounded-lg text-lg font-bold transition-colors h-12 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg mt-4"
                    >
                        Find a Specialist Now
                    </a>
                </div>
            </div>
        </div>
    );
}