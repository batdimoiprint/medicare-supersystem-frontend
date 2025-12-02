// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\landing\contact\ContactDetails.tsx

import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactDetails() {
    return (
        // Add a padding/background container for visual separation
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-border/50 h-full">
            <h2 className="text-3xl font-extrabold text-foreground border-b pb-2 mb-8">
                Get in Touch
            </h2>
            
            <div className="space-y-8">
                {/* Address */}
                <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Clinic Address</h3>
                        <p className="text-muted-foreground">
                            Unit 450, Supercare Tower, <br />
                            123 Diliman Avenue, Quezon City, <br />
                            Metro Manila, Philippines 1100
                        </p>
                    </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Appointment Hotline</h3>
                        <p className="text-muted-foreground hover:text-primary transition-colors">
                            <a href="tel:+63281234567">(+63 2) 8123 4567</a>
                        </p>
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">General Inquiries</h3>
                        <p className="text-muted-foreground hover:text-primary transition-colors">
                            <a href="mailto:contact@medicaresupersystem.ph">contact@medicaresupersystem.ph</a>
                        </p>
                    </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Clinic Hours</h3>
                        <p className="text-muted-foreground">
                            **Mon - Fri:** 8:00 AM - 5:00 PM<br />
                            **Sat:** 9:00 AM - 1:00 PM<br />
                            **Sun/Holidays:** Closed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}