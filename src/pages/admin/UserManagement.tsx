import { useState, useEffect } from 'react';
import { Edit, RotateCcw, Search, Filter, Ban, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import supabase from "@/utils/supabase";

// --- Types ---
export type UserRole = 'Dentist' | 'Patient' | 'Admin';
export type UserStatus = 'Active' | 'Suspended' | 'Inactive' | 'Pending';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('All Roles');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users from the public view 'users_view' which mirrors auth.users
      // NOTE: You must create this view in Supabase first!
      const { data: authUsers, error } = await supabase
        .from('users_view')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      if (authUsers) {
        const mappedUsers: User[] = authUsers.map((u: any) => {
          // Try to get name from metadata, fallback to email
          const meta = u.raw_user_meta_data || {};
          const fullName = meta.full_name || meta.name || (meta.f_name && meta.l_name ? `${meta.f_name} ${meta.l_name}` : u.email?.split('@')[0] || 'Unknown');
          
          return {
            id: u.id,
            name: fullName,
            email: u.email || 'N/A',
            phone: u.phone || meta.phone || meta.contact_no || 'N/A',
            role: meta.role || 'Patient', // Default to Patient
            status: 'Active', // auth.users doesn't have a simple status column visible by default
            lastLogin: u.last_sign_in_at || u.created_at,
          };
        });
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'All Roles' || user.role === filterRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      'Dentist': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Patient': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'Admin': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[role];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search users..."
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
                <SelectItem value="Patient">Patient</SelectItem>
                <SelectItem value="Dentist">Dentist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Joined/Login</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                     Loading users...
                   </td>
                 </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-medium border", getRoleColor(user.role))}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-2 py-1 rounded-full text-xs",
                       user.status === 'Active' ? "bg-green-500/20 text-green-400" :
                       user.status === 'Pending' ? "bg-yellow-500/20 text-yellow-400" :
                       "bg-red-500/20 text-red-400"
                     )}>
                       {user.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(user.lastLogin).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-cyan-500/20 text-cyan-400" title="Edit">
                        <Edit size={16} />
                      </Button>
                      {user.status === 'Active' ? (
                        <Button variant="ghost" size="icon" className="hover:bg-red-500/20 text-red-400" title="Suspend">
                          <Ban size={16} />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="hover:bg-green-500/20 text-green-400" title="Activate">
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="hover:bg-orange-500/20 text-orange-400" title="Reset Password">
                        <RotateCcw size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
