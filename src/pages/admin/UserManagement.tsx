import { useState, useEffect } from 'react';
import { Edit, Search, Filter, Ban, CheckCircle, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import supabase from "@/utils/supabase";

// --- Types matching personnel_tbl ---
export type PersonnelRole = 'Dentist' | 'Receptionist' | 'Cashier' | 'Inventory Manager' | 'Super Admin';
export type PersonnelStatus = 'Active' | 'Suspended' | 'Inactive' | 'Pending';
export type Gender = 'Male' | 'Female' | 'LGBTQIA+' | 'Prefer Not to Say';

export interface Personnel {
  personnel_id: number;
  employee_no: string;
  f_name: string | null;
  l_name: string | null;
  m_name: string | null;
  suffix: string | null;
  birthdate: string | null;
  gender: Gender | null;
  house_no: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  country: string | null;
  contact_no: string | null;
  email: string | null;
  password: string | null;
  account_status: PersonnelStatus;
  role_id: number;
  created_at: string | null;
}

export interface Role {
  role_id: number;
  role_name: PersonnelRole;
}

// Hardcoded staff roles (excluding Patient)
const STAFF_ROLES: Role[] = [
  { role_id: 1, role_name: 'Dentist' },
  { role_id: 2, role_name: 'Receptionist' },
  { role_id: 3, role_name: 'Cashier' },
  { role_id: 4, role_name: 'Inventory Manager' },
  { role_id: 5, role_name: 'Super Admin' },
];

// Form data for creating/editing personnel
export interface PersonnelFormData {
  employee_no: string;
  f_name: string;
  l_name: string;
  m_name: string;
  suffix: string;
  birthdate: string;
  gender: Gender | '';
  house_no: string;
  street: string;
  barangay: string;
  city: string;
  country: string;
  contact_no: string;
  email: string;
  password: string;
  account_status: PersonnelStatus;
  role_id: number | null;
}

const initialFormData: PersonnelFormData = {
  employee_no: '',
  f_name: '',
  l_name: '',
  m_name: '',
  suffix: '',
  birthdate: '',
  gender: '',
  house_no: '',
  street: '',
  barangay: '',
  city: '',
  country: 'Philippines',
  contact_no: '',
  email: '',
  password: '',
  account_status: 'Pending',
  role_id: null,
};

export default function UserManagement() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [roles] = useState<Role[]>(STAFF_ROLES);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('All Roles');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [formData, setFormData] = useState<PersonnelFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // Fetch all personnel from personnel_tbl
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personnel_tbl')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching personnel:', error);
        return;
      }

      if (data) {
        setPersonnel(data as Personnel[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get role name by role_id
  const getRoleName = (roleId: number): string => {
    const role = roles.find(r => r.role_id === roleId);
    return role?.role_name || 'Unknown';
  };

  // CREATE - Add new personnel
  const handleCreate = async () => {
    if (!formData.employee_no || !formData.f_name || !formData.l_name || !formData.role_id) {
      alert('Please fill in required fields: Employee No, First Name, Last Name, and Role');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('personnel_tbl')
        .insert([{
          employee_no: formData.employee_no,
          f_name: formData.f_name,
          l_name: formData.l_name,
          m_name: formData.m_name || null,
          suffix: formData.suffix || null,
          birthdate: formData.birthdate || null,
          gender: formData.gender || null,
          house_no: formData.house_no || null,
          street: formData.street || null,
          barangay: formData.barangay || null,
          city: formData.city || null,
          country: formData.country || null,
          contact_no: formData.contact_no || null,
          email: formData.email || null,
          password: formData.password || null,
          account_status: formData.account_status,
          role_id: formData.role_id,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Error creating personnel:', error);
        alert('Failed to create personnel: ' + error.message);
        return;
      }

      setShowCreateModal(false);
      setFormData(initialFormData);
      fetchPersonnel();
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  // UPDATE - Edit existing personnel
  const handleUpdate = async () => {
    if (!selectedPersonnel) return;

    try {
      setSaving(true);
      const updateData: Partial<Personnel> = {
        employee_no: formData.employee_no,
        f_name: formData.f_name,
        l_name: formData.l_name,
        m_name: formData.m_name || null,
        suffix: formData.suffix || null,
        birthdate: formData.birthdate || null,
        gender: formData.gender as Gender || null,
        house_no: formData.house_no || null,
        street: formData.street || null,
        barangay: formData.barangay || null,
        city: formData.city || null,
        country: formData.country || null,
        contact_no: formData.contact_no || null,
        email: formData.email || null,
        account_status: formData.account_status,
        role_id: formData.role_id!,
      };

      // Only update password if a new one is provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const { error } = await supabase
        .from('personnel_tbl')
        .update(updateData)
        .eq('personnel_id', selectedPersonnel.personnel_id);

      if (error) {
        console.error('Error updating personnel:', error);
        alert('Failed to update personnel: ' + error.message);
        return;
      }

      setShowEditModal(false);
      setSelectedPersonnel(null);
      setFormData(initialFormData);
      fetchPersonnel();
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  // DELETE - Remove personnel
  const handleDelete = async () => {
    if (!selectedPersonnel) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('personnel_tbl')
        .delete()
        .eq('personnel_id', selectedPersonnel.personnel_id);

      if (error) {
        console.error('Error deleting personnel:', error);
        alert('Failed to delete personnel: ' + error.message);
        return;
      }

      setShowDeleteModal(false);
      setSelectedPersonnel(null);
      fetchPersonnel();
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle account status (Activate/Suspend)
  const handleToggleStatus = async (person: Personnel) => {
    const newStatus: PersonnelStatus = person.account_status === 'Active' ? 'Suspended' : 'Active';
    
    try {
      const { error } = await supabase
        .from('personnel_tbl')
        .update({ account_status: newStatus })
        .eq('personnel_id', person.personnel_id);

      if (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + error.message);
        return;
      }

      fetchPersonnel();
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Open edit modal with selected personnel data
  const openEditModal = (person: Personnel) => {
    setSelectedPersonnel(person);
    setFormData({
      employee_no: person.employee_no,
      f_name: person.f_name || '',
      l_name: person.l_name || '',
      m_name: person.m_name || '',
      suffix: person.suffix || '',
      birthdate: person.birthdate || '',
      gender: person.gender || '',
      house_no: person.house_no || '',
      street: person.street || '',
      barangay: person.barangay || '',
      city: person.city || '',
      country: person.country || 'Philippines',
      contact_no: person.contact_no || '',
      email: person.email || '',
      password: '', // Don't pre-fill password
      account_status: person.account_status,
      role_id: person.role_id,
    });
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (person: Personnel) => {
    setSelectedPersonnel(person);
    setShowDeleteModal(true);
  };

  // Filter personnel based on role and search
  const filteredPersonnel = personnel.filter((person) => {
    const roleName = getRoleName(person.role_id);
    const matchesRole = filterRole === 'All Roles' || roleName === filterRole;
    const fullName = `${person.f_name || ''} ${person.l_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      person.employee_no.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'Dentist': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Receptionist': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Cashier': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Inventory Manager': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Super Admin': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[roleName] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusColor = (status: PersonnelStatus) => {
    const colors: Record<PersonnelStatus, string> = {
      'Active': 'bg-green-500/20 text-green-400',
      'Pending': 'bg-yellow-500/20 text-yellow-400',
      'Inactive': 'bg-gray-500/20 text-gray-400',
      'Suspended': 'bg-red-500/20 text-red-400',
    };
    return colors[status];
  };

  // Get initials from name
  const getInitials = (fName: string | null, lName: string | null) => {
    const first = fName?.[0] || '';
    const last = lName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Roles">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.role_id} value={role.role_name}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={() => {
            setFormData(initialFormData);
            setShowCreateModal(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus size={18} className="mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Loading staff...
                  </td>
                </tr>
              ) : filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No staff found.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((person) => (
                  <tr key={person.personnel_id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(person.f_name, person.l_name)}
                        </div>
                        <span className="font-medium text-foreground text-sm whitespace-nowrap">
                          {person.f_name} {person.m_name ? `${person.m_name[0]}.` : ''} {person.l_name} {person.suffix || ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm font-mono">{person.employee_no}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{person.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{person.contact_no || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded text-xs font-medium border whitespace-nowrap", getRoleColor(getRoleName(person.role_id)))}>
                        {getRoleName(person.role_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(person.account_status))}>
                        {person.account_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm whitespace-nowrap">
                      {person.created_at
                        ? new Date(person.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-cyan-500/20 text-cyan-400" 
                          title="Edit"
                          onClick={() => openEditModal(person)}
                        >
                          <Edit size={14} />
                        </Button>
                        {person.account_status === 'Active' ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-red-500/20 text-red-400" 
                            title="Suspend"
                            onClick={() => handleToggleStatus(person)}
                          >
                            <Ban size={14} />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-green-500/20 text-green-400" 
                            title="Activate"
                            onClick={() => handleToggleStatus(person)}
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-500/20 text-red-400" 
                          title="Delete"
                          onClick={() => openDeleteModal(person)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-primary p-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                {showCreateModal ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                {showCreateModal ? 'Add New Staff' : 'Edit Staff'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setFormData(initialFormData);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Employee No *</label>
                  <Input
                    placeholder="EMP-001"
                    value={formData.employee_no}
                    onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Role *</label>
                  <Select 
                    value={formData.role_id?.toString() || ''} 
                    onValueChange={(val) => setFormData({ ...formData, role_id: parseInt(val) })}
                  >
                    <SelectTrigger className="bg-muted/50 border">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.role_id} value={role.role_id.toString()}>
                          {role.role_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">First Name *</label>
                  <Input
                    placeholder="John"
                    value={formData.f_name}
                    onChange={(e) => setFormData({ ...formData, f_name: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Middle Name</label>
                  <Input
                    placeholder="Michael"
                    value={formData.m_name}
                    onChange={(e) => setFormData({ ...formData, m_name: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Last Name *</label>
                  <Input
                    placeholder="Doe"
                    value={formData.l_name}
                    onChange={(e) => setFormData({ ...formData, l_name: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Suffix</label>
                  <Input
                    placeholder="Jr., Sr., III"
                    value={formData.suffix}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Birthdate</label>
                  <Input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Gender</label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(val) => setFormData({ ...formData, gender: val as Gender })}
                  >
                    <SelectTrigger className="bg-muted/50 border">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="LGBTQIA+">LGBTQIA+</SelectItem>
                      <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Status</label>
                  <Select 
                    value={formData.account_status} 
                    onValueChange={(val) => setFormData({ ...formData, account_status: val as PersonnelStatus })}
                  >
                    <SelectTrigger className="bg-muted/50 border">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-2 block">Contact No</label>
                  <Input
                    placeholder="+63 912 345 6789"
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                    className="bg-muted/50 border"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-muted-foreground text-sm mb-2 block">
                  {showEditModal ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-muted/50 border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <h3 className="text-foreground font-medium mb-3">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground text-sm mb-2 block">House No / Bldg</label>
                    <Input
                      placeholder="123"
                      value={formData.house_no}
                      onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                      className="bg-muted/50 border"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm mb-2 block">Street</label>
                    <Input
                      placeholder="Main Street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="bg-muted/50 border"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm mb-2 block">Barangay</label>
                    <Input
                      placeholder="Barangay 1"
                      value={formData.barangay}
                      onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                      className="bg-muted/50 border"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm mb-2 block">City</label>
                    <Input
                      placeholder="Manila"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-muted/50 border"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? 'Saving...' : showCreateModal ? 'Create Staff' : 'Update Staff'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-red-600 p-4 flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Staff
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPersonnel(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-foreground mb-4">
                Are you sure you want to delete <strong>{selectedPersonnel.f_name} {selectedPersonnel.l_name}</strong>?
              </p>
              <p className="text-muted-foreground text-sm">
                This action cannot be undone. All data associated with this staff member will be permanently removed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPersonnel(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Deleting...' : 'Delete Staff'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
