// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\contact\GoogleMapEmbed.tsx

type MapProps = {
    location: { lat: number, lng: number };
    title: string;
}

export default function GoogleMapEmbed({ location, title }: MapProps) {
    // NOTE: You must replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key
    // or use a properly constructed Google Maps Embed iframe URL for non-API embeds.
    // For a production site, you should use the official React library (e.g., @react-google-maps/api).
    
    // Example Embed URL structure for a simple iframe:
    const embedUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Location</h2>
            <div className="relative overflow-hidden rounded-xl h-[400px]">
                <iframe
                    title={title}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen={false}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={embedUrl}
                    className="absolute inset-0 border-0"
                ></iframe>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                Click the map to open in Google Maps for directions.
            </p>
        </div>
    );
}