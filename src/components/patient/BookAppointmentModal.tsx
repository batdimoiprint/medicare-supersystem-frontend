import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import supabase from "@/utils/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentFormData {
  full_name: string;
  contact_number: string;
  address: string;
  email: string;
  service_category_id?: string;
  service_id?: string;
  dentist_id?: string;
  date?: string;
  time?: string;
  notes?: string;
}

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map service category and service tables properly
interface ServiceCategory {
  service_category_id: string;
  category_name: string;
  category_code: string;
  category_description: string;
}

interface Service {
  service_id: string;
  service_category_id: string;
  service_name: string;
  service_description: string;
  service_fee: number;
  service_duration: string;
}

export default function BookAppointmentModal({ isOpen, onClose }: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    full_name: "",
    contact_number: "",
    address: "",
    email: "",
    service_category_id: "",
    service_id: "",
    dentist_id: "",
    date: "",
    time: "",
    notes: "",
  });

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Filter services based on selected category
  const filteredServices = services.filter(
    (s) => s.service_category_id === formData.service_category_id
  );

  // Fetch patient data & service data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patient
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: patient, error } = await supabase
            .schema("patient_record")
            .from("patient_tbl")
            .select("*")
            .eq("email", user.email)
            .single();

          if (error) console.error("Error fetching patient:", error.message);
          else if (patient) {
            const addressParts = [patient.house_no, patient.street, patient.barangay, patient.city].filter(Boolean);
            setFormData({
              full_name: `${patient.f_name || ""} ${patient.l_name || ""}`.trim(),
              contact_number: patient.pri_contact_no || "",
              address: addressParts.join(" "),
              email: patient.email || "",
              service_category_id: "",
              service_id: "",
              dentist_id: "",
              date: "",
              time: "",
              notes: "",
            });
          }
        }

        // Fetch service categories from dentist schema
        const { data: categories, error: catErr } = await supabase
          .schema("dentist")
          .from("service_category_tbl")
          .select("*");
        if (catErr) console.error("Error fetching categories:", catErr.message);
        else setServiceCategories(categories || []);

        // Fetch services from dentist schema
        const { data: serviceData, error: servErr } = await supabase
          .schema("dentist")
          .from("services_tbl")
          .select("*");
        if (servErr) console.error("Error fetching services:", servErr.message);
        else setServices(serviceData || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      full_name: "",
      contact_number: "",
      address: "",
      email: "",
      service_category_id: "",
      service_id: "",
      dentist_id: "",
      date: "",
      time: "",
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Complete the details below to schedule your visit.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading patient details...</p>
            </div>
          ) : (
            step === 1 && (
              <div className="space-y-6 pb-6">
                {/* SECTION 1: Patient Snapshot */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <User className="w-4 h-4" /> Patient Details (Snapshot)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" value={formData.full_name || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input id="contact" value={formData.contact_number || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={formData.email || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={formData.address || ""} readOnly />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Service Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Service Category</Label>
                      <Select
                        value={formData.service_category_id}
                        onValueChange={(val) =>
                          setFormData({ ...formData, service_category_id: val, service_id: "" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.map((c) => (
                            <SelectItem key={c.service_category_id} value={c.service_category_id}>
                              {c.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Specific Service</Label>
                      <Select
                        value={formData.service_id}
                        onValueChange={(val) => setFormData({ ...formData, service_id: val })}
                        disabled={!formData.service_category_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredServices.map((s) => (
                            <SelectItem key={s.service_id} value={s.service_id}>
                              {s.service_name} (₱{s.service_fee})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={resetAndClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
