// C:\Users\gulfe\SIA-Project\medicare-supersystem-frontend-main\src\components\landing\contact\ContactForm.tsx

import { useState } from 'react';

export default function ContactForm() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        // --- Replace this with your actual API submission logic ---
        try {
            console.log("Submitting form data:", formData);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            // On success:
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });

        } catch (error) {
            console.error("Form submission error:", error);
            setStatus('error');
        }
        // --------------------------------------------------------
    };

    return (
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-border/50">
            <h2 className="text-3xl font-bold text-foreground mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-border rounded-lg bg-input placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-border rounded-lg bg-input placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-border rounded-lg bg-input placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                    />
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                        Your Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-border rounded-lg bg-input placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 resize-y"
                    ></textarea>
                </div>

                {/* Submission Status & Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        // Updated className for style consistency: 
                        // Added shadow-md and increased px/py slightly for a better feel.
                        className="w-full py-3 px-6 rounded-lg text-base font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:bg-primary/50 disabled:cursor-not-allowed"
                    >
                        {status === 'submitting' ? 'Sending Message...' : 'Send Message'}
                    </button>
                    
                    {status === 'success' && (
                        <p className="mt-3 text-sm text-green-500 font-medium">
                            ✅ Message sent successfully! We will be in touch soon.
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="mt-3 text-sm text-red-500 font-medium">
                            ❌ Failed to send message. Please try again later.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}