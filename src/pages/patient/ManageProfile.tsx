// C:\Users\gulfe\Medi\medicare-supersystem-frontend\src\pages\patient\ManageProfile.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea'; // ⬅️ FIX: Added missing Textarea component import

// Mocked utility for password hashing (replace with actual bcrypt/crypto module)
// import bcrypt from 'bcryptjs'; 

// --- TYPE DEFINITIONS (omitted for brevity) ---
interface ProfileForm {
    f_name: string;
    l_name: string;
    m_name: string;
    suffix: string;
    birthdate: string;
    gender: string;
    blood_type: string;
    pri_contact_no: string;
    sec_contact_no?: string;
    email: string;
    address: string;
    ec_f_name: string;
    ec_l_name: string;
    ec_relationship: string;
    ec_contact_no: string;
    current_password?: string;
    new_password?: string;
    confirm_new_password?: string;
}

// --- MOCK INITIAL DATA & CONSTANTS (omitted for brevity) ---
const MOCK_PATIENT_DATA = {/* ... */};
const GENDER_OPTIONS = ['Male', 'Female', 'LGBTQIA+', 'Prefer Not to Say'];
const BLOOD_TYPES = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-', 'Unspecified'];
const RELATIONSHIPS = ['Parent', 'Child', 'Relative', 'Spouse', 'Friend', 'Sibling', 'Guardian', 'Others', 'Unspecified'];


export default function ManageProfile() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('personal');

    // FIX: Removed 'reset' as it's currently unused, but kept for future reference if needed.
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ProfileForm>({
        mode: 'onBlur',
        defaultValues: MOCK_PATIENT_DATA,
    });

    const currentPassword = watch('new_password');
    
    // FIX: Removed unused 'pass' parameter from the mock function signature.
    const getStrength = (password: string) => { 
        /* ... */ 
        if (!password) return 0;
        // Simple mock strength check for demonstration/cleanup
        if (password.length < 8) return 1;
        if (password.length < 10) return 2;
        if (/[A-Z]/.test(password) && /\d/.test(password)) return 3;
        return 4;
    }
    const strength = getStrength(currentPassword || "");
    const strengthColor = ['bg-border', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-green-500'];
    const strengthText = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong'];


    // FIX: Added placeholder logic to use submit states.
    async function onFormSubmit(data: ProfileForm) {
        setSubmitError(null);
        setSubmitSuccess(null);
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            // Example of a successful update
            if (data.f_name === 'fail') { // Simple mock failure condition
                throw new Error("Update failed due to server error.");
            }
            
            setSubmitSuccess("Your profile has been successfully updated.");
            // In a real app, you might only reset password fields, not the whole form.
            // reset(data, { keepValues: true }); 

        } catch (error) {
            console.error("Submission error:", error);
            setSubmitError((error as Error).message || "An unknown error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <User className="w-7 h-7 text-primary" />
                    Manage Account
                </h1>
                <Button variant="outline" onClick={() => navigate('/patient/profile')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
                </Button>
            </div>

            {/* FIX: Alerts JSX added to display submit status */}
            {submitSuccess && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                    <Save className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{submitSuccess}</AlertDescription>
                </Alert>
            )}

            {submitError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            )}
            {/* End of Alerts JSX */}

            <form onSubmit={handleSubmit(onFormSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Information</CardTitle>
                        <CardDescription>
                            Update your personal records and security settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                                <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                                <TabsTrigger value="security">Security</TabsTrigger>
                            </TabsList>

                            {/* --- TAB 1: PERSONAL INFO --- */}
                            <TabsContent value="personal" className="space-y-6">
                                <FieldGroup>
                                    <h3 className="text-lg font-semibold text-foreground">Identity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* ... (First name, middle name, last name, suffix fields) ... */}
                                        {/* Added placeholder fields for completeness, assuming they are similar to the ones below */}
                                        <Field orientation="vertical"><FieldLabel>First Name</FieldLabel><FieldContent><Input {...register('f_name')} /></FieldContent></Field>
                                        <Field orientation="vertical"><FieldLabel>Middle Name</FieldLabel><FieldContent><Input {...register('m_name')} /></FieldContent></Field>
                                        <Field orientation="vertical"><FieldLabel>Last Name</FieldLabel><FieldContent><Input {...register('l_name')} /></FieldContent></Field>
                                        <Field orientation="vertical"><FieldLabel>Suffix</FieldLabel><FieldContent><Input {...register('suffix')} /></FieldContent></Field>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field orientation="vertical">
                                            <FieldLabel>Birth date</FieldLabel>
                                            <FieldContent>
                                                <Input type="date" {...register('birthdate')} placeholder="YYYY-MM-DD" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel>Gender</FieldLabel>
                                            <FieldContent>
                                                <Controller control={control} name="gender" render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel>Blood type</FieldLabel>
                                            <FieldContent>
                                                <Controller control={control} name="blood_type" render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {BLOOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </FieldContent>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </TabsContent>

                            {/* --- TAB 2: CONTACT & ADDRESS --- */}
                            <TabsContent value="contact" className="space-y-6">
                                <FieldGroup>
                                    <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field orientation="vertical">
                                            <FieldLabel className="flex items-center gap-1"><Phone className="w-4 h-4 text-muted-foreground" /> Primary Contact</FieldLabel>
                                            <FieldContent>
                                                <Input {...register('pri_contact_no')} placeholder="e.g. 9171234567" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel className="flex items-center gap-1"><Phone className="w-4 h-4 text-muted-foreground" /> Secondary Contact</FieldLabel>
                                            <FieldContent>
                                                <Input {...register('sec_contact_no')} placeholder="Optional" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel className="flex items-center gap-1"><Mail className="w-4 h-4 text-muted-foreground" /> Email</FieldLabel>
                                            <FieldContent>
                                                <Input {...register('email')} placeholder="Email" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel className="flex items-center gap-1"><MapPin className="w-4 h-4 text-muted-foreground" /> Address</FieldLabel>
                                            <FieldContent>
                                                {/* Textarea usage is fixed here */}
                                                <Textarea {...register('address')} placeholder="Full address" className="resize-none min-h-[100px]" /> 
                                            </FieldContent>
                                        </Field>
                                    </div>

                                    <Separator className="mt-8 mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field orientation="vertical">
                                            <FieldLabel>First Name</FieldLabel>
                                            <FieldContent>
                                                <Input {...register('ec_f_name')} placeholder="First name" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel>Last Name</FieldLabel>
                                            <FieldContent>
                                                <Input {...register('ec_l_name')} placeholder="Last name" />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel>Relationship</FieldLabel>
                                            <FieldContent>
                                                <Controller control={control} name="ec_relationship" render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </FieldContent>
                                        </Field>
                                    </div>
                                    <Field orientation="vertical" className="w-full md:w-1/3">
                                        <FieldLabel>Contact Number</FieldLabel>
                                        <FieldContent>
                                            <Input {...register('ec_contact_no')} placeholder="e.g. 9201112222" />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </TabsContent>

                            {/* --- TAB 3: SECURITY --- */}
                            <TabsContent value="security" className="space-y-6">
                                <FieldGroup>
                                    <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                                    <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertTitle>Security Warning</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Changing your password will require you to log in again immediately. Ensure your new password is secure.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field orientation="vertical">
                                            <FieldLabel>Current Password <span className="text-red-500">*</span></FieldLabel>
                                            <FieldContent>
                                                <Input 
                                                    {...register('current_password', { required: 'Required to confirm identity.' })} 
                                                    type="password" 
                                                    placeholder="Enter current password" 
                                                />
                                                <FieldError errors={errors.current_password ? [{ message: errors.current_password.message }] : []} />
                                            </FieldContent>
                                        </Field>
                                        <div />

                                        <Field orientation="vertical">
                                            <FieldLabel>New Password <span className="text-red-500">*</span></FieldLabel>
                                            <FieldContent>
                                                <Input 
                                                    {...register('new_password', { 
                                                        required: 'Required', 
                                                        minLength: { value: 8, message: 'Min 8 characters' } 
                                                    })} 
                                                    type="password" 
                                                    placeholder="Enter new password" 
                                                />
                                                <div className="mt-2 flex gap-1 h-1">
                                                    {[0, 1, 2, 3].map((i) => (
                                                        <div key={i} className={`h-full flex-1 rounded-full transition-colors ${i < strength ? strengthColor[strength] : 'bg-muted'}`} />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{strengthText[strength]}</p>
                                                <FieldError errors={errors.new_password ? [{ message: errors.new_password.message }] : []} />
                                            </FieldContent>
                                        </Field>
                                        <Field orientation="vertical">
                                            <FieldLabel>Confirm New Password <span className="text-red-500">*</span></FieldLabel>
                                            <FieldContent>
                                                <Input 
                                                    {...register('confirm_new_password', { 
                                                        validate: v => v === watch('new_password') || "Passwords do not match" 
                                                    })} 
                                                    type="password" 
                                                    placeholder="Confirm new password" 
                                                />
                                                <FieldError errors={errors.confirm_new_password ? [{ message: errors.confirm_new_password.message }] : []} />
                                            </FieldContent>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}