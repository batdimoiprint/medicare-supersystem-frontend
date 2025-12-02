import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import supabase from "@/utils/supabase";

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  active: boolean;
  description: string;
  duration: number;
  price: number;
}

const formatDurationToTime = (minutes: string | number) => {
  const mins = typeof minutes === 'string' ? parseInt(minutes) : minutes;
  if (isNaN(mins)) return '00:30:00';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
};

const parseTimeToDuration = (timeStr: string) => {
  if (!timeStr) return 30;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  } catch (e) {
    return 30;
  }
};

const formatDurationDisplay = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  
  if (h > 0 && m > 0) return `${h} hr${h > 1 ? 's' : ''} ${m} mins`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} mins`;
};

export default function ServiceManagement() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddService, setShowAddService] = useState(false);
  const [showEditService, setShowEditService] = useState(false);
  const [showDeleteService, setShowDeleteService] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Categories
      const { data: catData, error: catError } = await supabase
        .schema('dentist')
        .from('service_category_tbl')
        .select('*');

      if (catError) throw new Error(`Categories Error: ${catError.message}`);

      let mappedCategories: ServiceCategory[] = [];
      if (catData) {
        mappedCategories = catData.map((c: any) => ({
          id: c.service_category_id.toString(),
          name: c.category_name || c.service_category_name || 'Unknown Category'
        }));
        setServiceCategories(mappedCategories);
        
        if (mappedCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(mappedCategories[0].id);
            setNewServiceCategory(mappedCategories[0].id);
        }
      }

      // Fetch Services
      const { data: servData, error: servError } = await supabase
        .schema('dentist')
        .from('services_tbl')
        .select('*');

      if (servError) throw new Error(`Services Error: ${servError.message}`);

      if (servData) {
        const mappedServices: Service[] = servData.map((s: any) => ({
          id: s.service_id.toString(),
          categoryId: s.service_category_id.toString(),
          name: s.service_name,
          active: true,
          description: s.service_description,
          duration: s.service_duration ? parseTimeToDuration(s.service_duration) : 30,
          price: s.service_fee
        }));
        setServices(mappedServices);
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName || !newServiceCategory || !newServicePrice) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the max ID to manually increment (workaround for sequence out of sync)
      const { data: maxData } = await supabase
        .schema('dentist')
        .from('services_tbl')
        .select('service_id')
        .order('service_id', { ascending: false })
        .limit(1)
        .single();

      const nextId = maxData ? maxData.service_id + 1 : 1;

      const { error } = await supabase
        .schema('dentist')
        .from('services_tbl')
        .insert({
          service_id: nextId,
          service_category_id: parseInt(newServiceCategory),
          service_name: newServiceName,
          service_description: newServiceDescription,
          service_fee: parseFloat(newServicePrice),
          service_duration: formatDurationToTime(newServiceDuration)
        });

      if (error) throw error;

      // Reset form and refresh data
      setShowAddService(false);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDescription('');
      fetchData();
      
    } catch (err: any) {
      console.error('Error creating service:', err);
      alert(`Failed to create service: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setNewServiceName(service.name);
    setNewServiceCategory(service.categoryId);
    setNewServiceDuration(service.duration.toString());
    setNewServicePrice(service.price.toString());
    setNewServiceDescription(service.description || '');
    setShowEditService(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService || !newServiceName || !newServiceCategory || !newServicePrice) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .schema('dentist')
        .from('services_tbl')
        .update({
          service_category_id: parseInt(newServiceCategory),
          service_name: newServiceName,
          service_description: newServiceDescription,
          service_fee: parseFloat(newServicePrice),
          service_duration: formatDurationToTime(newServiceDuration)
        })
        .eq('service_id', parseInt(selectedService.id));

      if (error) throw error;

      setShowEditService(false);
      setSelectedService(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating service:', err);
      alert(`Failed to update service: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setShowDeleteService(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .schema('dentist')
        .from('services_tbl')
        .delete()
        .eq('service_id', parseInt(selectedService.id));

      if (error) throw error;

      setShowDeleteService(false);
      setSelectedService(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting service:', err);
      alert(`Failed to delete service: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryServices = services.filter((s) => s.categoryId === selectedCategory);
  const selectedCat = serviceCategories.find((c) => c.id === selectedCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
          <p className="text-muted-foreground">Manage your dental services and pricing</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md border border-destructive/20">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-bold text-primary">Categories</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
              <Plus size={18} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : serviceCategories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No categories found</div>
            ) : (
                serviceCategories.map((category) => {
                const catServices = services.filter((s) => s.categoryId === category.id);
                const isSelected = selectedCategory === category.id;
                return (
                    <Button
                    key={category.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className={cn(
                        "w-full justify-between h-auto py-3",
                        isSelected && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => setSelectedCategory(category.id)}
                    >
                    <div className="flex items-center gap-3">
                        <List size={18} />
                        <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                        {catServices.length}
                    </Badge>
                    </Button>
                );
                })
            )}
          </CardContent>
        </Card>

        {/* Services List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-primary">{selectedCat?.name || 'Select Category'}</CardTitle>
              <CardDescription>{categoryServices.length} services available</CardDescription>
            </div>
            <Button onClick={() => setShowAddService(true)} className="gap-2">
              <Plus size={18} />
              Add Service
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
                 <div className="text-center py-12 text-muted-foreground">Loading services...</div>
            ) : categoryServices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No services found in this category.</p>
                <Button variant="link" onClick={() => setShowAddService(true)}>Add your first service</Button>
              </div>
            ) : (
                categoryServices.map((service) => (
                <div
                    key={service.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{service.name}</h4>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm pt-1">
                      <div className="text-muted-foreground">
                        Duration: <span className="text-foreground font-medium">{formatDurationDisplay(service.duration)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Price: <span className="text-primary font-bold">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                      onClick={() => handleEditClick(service)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(service)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
            )))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Service Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Teeth Cleaning" 
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newServiceCategory} onValueChange={setNewServiceCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input 
                    id="duration" 
                    type="number" 
                    placeholder="45" 
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price (₱)</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="1500" 
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of the service..." 
                className="resize-none"
                rows={3}
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddService(false)}>Cancel</Button>
            <Button onClick={handleCreateService} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditService} onOpenChange={setShowEditService}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Service Name</Label>
              <Input 
                id="edit-name" 
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={newServiceCategory} onValueChange={setNewServiceCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input 
                    id="edit-duration" 
                    type="number" 
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (₱)</Label>
              <Input 
                id="edit-price" 
                type="number" 
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea 
                id="edit-description" 
                className="resize-none"
                rows={3}
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditService(false)}>Cancel</Button>
            <Button onClick={handleUpdateService} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteService} onOpenChange={setShowDeleteService}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <CardDescription>
              Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
            </CardDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteService(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
