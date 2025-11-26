import ContactForm from '@/components/landing/Contact/ContactForm';
import ContactDetails from '@/components/landing/Contact/ContactDetails';
import GoogleMapEmbed from '@/components/landing/Contact/GoogleMapEmbed';
import ContactHero from '@/components/landing/Contact/ContactHero';

export default function ContactPage() {
    return (
        <main className="bg-background">
            
            <ContactHero />

            <div className="container mx-auto px-4 py-16 md:py-24">
                
                {/* Top Section: Google Map takes up full width */}
                <div className="mb-12">
                    <GoogleMapEmbed 
                        location={{ lat: 14.6515, lng: 121.0494 }} // Example coordinates (Quezon City)
                        title="Medicare Super System Clinic"
                    />
                </div>

                {/* Bottom Section: Contact Form and Details side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* LEFT: Contact Details (Address, Hours, etc.) */}
                    <div className="lg:col-span-1">
                        <ContactDetails />
                    </div>

                    {/* RIGHT: Contact Form (Send Us a Message) */}
                    <div className="lg:col-span-1">
                        {/* The ContactForm component already contains its own header */}
                        <ContactForm />
                    </div>
                </div>
            </div>
        </main>
    );
}
