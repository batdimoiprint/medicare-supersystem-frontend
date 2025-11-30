import { useState, useEffect } from 'react';
import { 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Droplet, 
    Shield, 
    Edit2, 
    Save, 
    X, 
    ArrowLeft,
    Camera,
    Contact
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import supabase from '@/utils/supabase';

interface PatientProfile {
    patient_id: number;
    f_name: string;
    l_name: string;
    m_name?: string;
    suffix?: string;
    birthdate: string;
    gender: 'Male' | 'Female' | 'LGBTQIA+' | 'Prefer Not to Say';
    email?: string;
    address: string;
    blood_type?: 'A+' | 'A-' | 'AB+' | 'AB-' | 'B+' | 'B-' | 'O+' | 'O-' | 'Unspecified';
    pri_contact_no: string;
    sec_contact_no?: string;
    account_status: 'Pending' | 'Active' | 'Inactive' | 'Suspended';
    created_at: string;
    image_url?: string;
}

interface EmergencyContact {
    ec_f_name: string;
    ec_l_name: string;
    ec_contact_no: string;
    ec_relationship: 'Parent' | 'Child' | 'Relative' | 'Spouse' | 'Friend' | 'Sibling' | 'Guardian' | 'Others' | 'Unspecified';
    ec_email?: string;
}

export default function PatientProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [ec, setEc] = useState<EmergencyContact | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch current user patient data
    useEffect(() => {
        const fetchPatientData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const { data: user, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    setError('Authentication error: ' + userError.message);
                    return;
                }

                if (!user?.user) {
                    setError('No user logged in');
                    return;
                }

                // Fetch patient profile from patient_record schema
                const { data: patientData, error: patientError } = await supabase
                    .schema('patient_record')
                    .from('patient_tbl')
                    .select('*')
                    .eq('email', user.user.email)
                    .single();

                if (patientError) {
                    console.error('Error fetching patient:', patientError);
                    setError('Could not load patient profile: ' + patientError.message);
                    return;
                }

                if (!patientData) {
                    setError('Patient profile not found for email: ' + user.user.email);
                    return;
                }

                setProfile(patientData);

                // Fetch emergency contact from the same schema
                if (patientData.patient_id) {
                    const { data: ecData, error: ecError } = await supabase
                        .schema('patient_record')
                        .from('emergency_contact_tbl')
                        .select('*')
                        .eq('patient_id', patientData.patient_id)
                        .single();

                    if (ecError) {
                        console.error('Error fetching emergency contact:', ecError.message);
                    } else {
                        setEc(ecData);
                    }
                }

            } catch (err) {
                console.error('Unexpected error:', err);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, []);

    const calculateAge = (birthdate: string) => {
        const birthDate = new Date(birthdate);
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleSave = async () => {
        if (!profile) return;
        setLoading(true);
        setError(null);

        try {
            // Update patient profile in patient_record schema
            const { error: updatePatientError } = await supabase
                .schema('patient_record')
                .from('patient_tbl')
                .update({
                    f_name: profile.f_name,
                    l_name: profile.l_name,
                    m_name: profile.m_name,
                    suffix: profile.suffix,
                    birthdate: profile.birthdate,
                    gender: profile.gender,
                    email: profile.email,
                    address: profile.address,
                    blood_type: profile.blood_type,
                    pri_contact_no: profile.pri_contact_no,
                    sec_contact_no: profile.sec_contact_no
                })
                .eq('patient_id', profile.patient_id);

            if (updatePatientError) {
                console.error('Error updating patient:', updatePatientError);
                setError('Error updating profile: ' + updatePatientError.message);
                return;
            }

            // Update emergency contact
            if (ec) {
                const { error: updateEcError } = await supabase
                    .schema('patient_record')
                    .from('emergency_contact_tbl')
                    .upsert({ 
                        ...ec, 
                        patient_id: profile.patient_id 
                    })
                    .eq('patient_id', profile.patient_id);

                if (updateEcError) {
                    console.error('Error updating emergency contact:', updateEcError);
                }
            }

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Unexpected error during save:', err);
            setError('An unexpected error occurred while saving');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-64">
            <p>Loading profile...</p>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="flex justify-center items-center min-h-64">
            <p>Profile not found.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 max-w-6xl mx-auto">
            
            {/* Navigation / Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </Button>
                            <Button onClick={handleSave} className="gap-2" disabled={loading}>
                                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} className="gap-2">
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: ID Card Style */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-none shadow-lg">
                        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
                        <CardContent className="relative pt-0 text-center -mt-16 pb-8">
                            <div className="relative inline-block">
                                <Avatar className="w-32 h-32 border-4 border-background shadow-md mx-auto">
                                    <AvatarImage src={profile.image_url} />
                                    <AvatarFallback className="text-4xl bg-muted">{profile.f_name[0]}{profile.l_name[0]}</AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-md h-8 w-8">
                                        <Camera className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            
                            <div className="mt-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {profile.f_name} {profile.m_name} {profile.l_name} {profile.suffix}
                                </h2>
                                <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-2">
                                    Patient ID: #{profile.patient_id.toString().padStart(5, '0')}
                                </p>
                            </div>

                            <div className="mt-4 flex justify-center gap-2">
                                <Badge className={getStatusColor(profile.account_status)}>
                                    {profile.account_status}
                                </Badge>
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                    Member since {new Date(profile.created_at).getFullYear()}
                                </Badge>
                            </div>

                            <Separator className="my-6" />

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Gender</p>
                                    <p className="text-sm font-medium">{profile.gender}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Age</p>
                                    <p className="text-sm font-medium">{calculateAge(profile.birthdate)} Years Old</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Blood Type</p>
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <Droplet className="w-3 h-3 text-red-500 fill-red-500" /> {profile.blood_type || 'Unspecified'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details Forms */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="contact">Contact Details</TabsTrigger>
                            <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                        </TabsList>

                        {/* --- Personal Information Tab --- */}
                        <TabsContent value="personal">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" /> Personal Information
                                    </CardTitle>
                                    <CardDescription>
                                        Official identification details stored in Patient Records.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input disabled={!isEditing} value={profile.f_name} onChange={(e) => setProfile({...profile, f_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input disabled={!isEditing} value={profile.l_name} onChange={(e) => setProfile({...profile, l_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Middle Name</Label>
                                            <Input disabled={!isEditing} value={profile.m_name || ''} onChange={(e) => setProfile({...profile, m_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Suffix</Label>
                                            <Input disabled={!isEditing} placeholder="e.g. Jr, III" value={profile.suffix || ''} onChange={(e) => setProfile({...profile, suffix: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Birthdate</Label>
                                            <Input type="date" disabled={!isEditing} value={profile.birthdate} onChange={(e) => setProfile({...profile, birthdate: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            {isEditing ? (
                                                <Select value={profile.gender} onValueChange={(val: any) => setProfile({...profile, gender: val})}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="LGBTQIA+">LGBTQIA+</SelectItem>
                                                        <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input disabled value={profile.gender} />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Blood Type</Label>
                                            {isEditing ? (
                                                <Select value={profile.blood_type || 'Unspecified'} onValueChange={(val: any) => setProfile({...profile, blood_type: val})}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-', 'Unspecified'].map(t => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input disabled value={profile.blood_type || 'Unspecified'} />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- Contact Details Tab --- */}
                        <TabsContent value="contact">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Contact className="w-5 h-5 text-primary" /> Contact Details
                                    </CardTitle>
                                    <CardDescription>
                                        How we can reach you for appointments and notifications.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Home Address</Label>
                                        <Textarea 
                                            className="resize-none"
                                            disabled={!isEditing} 
                                            value={profile.address} 
                                            onChange={(e) => setProfile({...profile, address: e.target.value})} 
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Email Address</Label>
                                            <Input disabled={!isEditing} type="email" value={profile.email || ''} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Primary Mobile</Label>
                                            <Input disabled={!isEditing} value={profile.pri_contact_no} onChange={(e) => setProfile({...profile, pri_contact_no: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Secondary Mobile</Label>
                                            <Input disabled={!isEditing} value={profile.sec_contact_no || ''} onChange={(e) => setProfile({...profile, sec_contact_no: e.target.value})} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* --- Emergency Contact Tab --- */}
                        <TabsContent value="emergency">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary" /> Emergency Contact
                                    </CardTitle>
                                    <CardDescription>
                                        Primary contact person in case of emergency.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ec ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Contact First Name</Label>
                                                    <Input disabled={!isEditing} value={ec.ec_f_name} onChange={(e) => setEc({...ec, ec_f_name: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Contact Last Name</Label>
                                                    <Input disabled={!isEditing} value={ec.ec_l_name} onChange={(e) => setEc({...ec, ec_l_name: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Relationship</Label>
                                                    {isEditing ? (
                                                        <Select value={ec.ec_relationship} onValueChange={(val: any) => setEc({...ec, ec_relationship: val})}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {['Parent', 'Child', 'Relative', 'Spouse', 'Friend', 'Sibling', 'Guardian', 'Others', 'Unspecified'].map(r => (
                                                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input disabled value={ec.ec_relationship} />
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Emergency Mobile No.</Label>
                                                    <Input disabled={!isEditing} value={ec.ec_contact_no} onChange={(e) => setEc({...ec, ec_contact_no: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Emergency Email (Optional)</Label>
                                                <Input disabled={!isEditing} value={ec.ec_email || ''} onChange={(e) => setEc({...ec, ec_email: e.target.value})} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground mb-4">No emergency contact found.</p>
                                            {isEditing && (
                                                <Button 
                                                    onClick={() => setEc({
                                                        ec_f_name: '',
                                                        ec_l_name: '',
                                                        ec_contact_no: '',
                                                        ec_relationship: 'Unspecified',
                                                        ec_email: ''
                                                    })}
                                                >
                                                    Add Emergency Contact
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}