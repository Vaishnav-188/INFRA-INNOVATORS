import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { toast } from 'sonner';
import {
    Search,
    Trash2,
    ChevronLeft,
    Download,
    Filter,
    User as UserIcon,
    GraduationCap,
    Briefcase
} from 'lucide-react';

const AdminUserDirectory = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const pageRef = usePageTransition();
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') || 'student';

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState(initialRole);
    const [filterBatch, setFilterBatch] = useState('all');

    const fetchUsers = async () => {
        const token = localStorage.getItem('alumni_hub_token');
        setLoading(true);
        try {
            const res = await fetch(`/api/users?role=${filterRole === 'all' ? '' : filterRole}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            toast.error('Failed to load user directory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [filterRole, user]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/signin');
        }
    }, [user, navigate, authLoading]);

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Permanently delete ${name}'s account?`)) return;

        const token = localStorage.getItem('alumni_hub_token');
        try {
            const response = await fetch(`/api/users/reject/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`${name} removed`);
                setUsers(users.filter(u => u._id !== id));
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.collegeEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBatch = filterBatch === 'all' || u.batch === filterBatch;

        return matchesSearch && matchesBatch;
    });

    const batches = Array.from(new Set(users.map(u => u.batch))).filter(Boolean).sort();

    const exportToCSV = () => {
        const headers = filterRole === 'alumni'
            ? ['Name', 'Email', 'Batch', 'Company', 'Role', 'LinkedIn']
            : ['Name', 'Email', 'Batch', 'Roll Number', 'Year'];

        const rows = filteredUsers.map(u => filterRole === 'alumni'
            ? [u.name, u.collegeEmail, u.batch, u.currentCompany, u.jobRole, u.linkedIn]
            : [u.name, u.collegeEmail, u.batch, u.rollNumber, u.yearOfStudy]
        );

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filterRole}_directory.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading) return null;

    return (
        <MainLayout>
            <div ref={pageRef} className="pt-40 px-6 md:px-12 max-w-[1700px] mx-auto pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-xs font-black uppercase tracking-widest"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Portal Home
                        </button>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter">
                            User <span className="text-primary">Directory</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-60">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full bg-card/40 backdrop-blur-md border border-border h-14 pl-12 pr-4 rounded-3xl font-bold text-sm outline-none focus:ring-2 ring-primary/20 transition-all shadow-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="h-14 px-6 bg-card text-foreground rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-muted transition-all shadow-xl"
                        >
                            <Download size={18} /> EXPORT
                        </button>

                        <button
                            onClick={async () => {
                                const keyword = prompt(`⚠️ ACTION REQUIRED: To delete ALL ${filterRole} accounts, please type "DELETE ALL" to confirm.`);
                                if (keyword === "DELETE ALL") {
                                    const confirm2 = window.confirm(`FINAL WARNING: This will permanently erase ALL ${filterRole.toUpperCase()} records. This action cannot be undone. Are you absolutely sure?`);
                                    if (!confirm2) return;

                                    const token = localStorage.getItem('alumni_hub_token');
                                    try {
                                        const res = await fetch(`/api/users/bulk-delete/${filterRole}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            toast.success(data.message);
                                            fetchUsers();
                                        }
                                    } catch (err) {
                                        toast.error("Bulk delete failed");
                                    }
                                } else if (keyword !== null) {
                                    toast.error("Confirmation failed. Keyword mismatch.");
                                }
                            }}
                            className="h-14 px-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-destructive hover:text-white transition-all shadow-xl"
                        >
                            <Trash2 size={18} /> PURGE {filterRole}s
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                    <div className="md:col-span-4 lg:col-span-3">
                        <GlassCard className="p-1.5 flex gap-1 rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl">
                            <button
                                onClick={() => setFilterRole('student')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === 'student' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted/50 text-muted-foreground'}`}
                            >
                                <GraduationCap size={16} /> Students
                            </button>
                            <button
                                onClick={() => setFilterRole('alumni')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === 'alumni' ? 'bg-success text-success-foreground shadow-lg' : 'hover:bg-muted/50 text-muted-foreground'}`}
                            >
                                <Briefcase size={16} /> Alumni
                            </button>
                        </GlassCard>
                    </div>

                    <div className="md:col-span-3 lg:col-span-2">
                        <div className="relative h-full">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            <select
                                value={filterBatch}
                                onChange={(e) => setFilterBatch(e.target.value)}
                                className="w-full h-full bg-background/50 backdrop-blur-md border border-border pl-12 pr-10 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-primary/30 transition-all shadow-lg"
                            >
                                <option value="all">ALL BATCHES</option>
                                {batches.map(b => (
                                    <option key={b} value={b}>BATCH: {b}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                <ChevronLeft size={16} className="-rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                <GlassCard className="overflow-hidden border border-border shadow-2xl rounded-[2rem]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">User</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Identifiers</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Batch</th>
                                    {filterRole === 'alumni' ? (
                                        <>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Company & Role</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">LinkedIn</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Year of Study</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Degree</th>
                                        </>
                                    )}
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Compiling Records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center font-bold text-muted-foreground italic">
                                            No matching users found in the directory.
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${filterRole === 'alumni' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                                    {u.name?.charAt(0) || <UserIcon size={14} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground text-sm uppercase tracking-tight">{u.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">{u.collegeEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-foreground">{u.rollNumber || 'N/A'}</p>
                                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">ROLL NUMBER</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-foreground">
                                            <span className="bg-muted px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                {u.batch || 'N/A'}
                                            </span>
                                        </td>
                                        {filterRole === 'alumni' ? (
                                            <>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-foreground">{u.currentCompany || 'Not Placed'}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{u.jobRole || 'No Role'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {u.linkedIn ? (
                                                        <a href={u.linkedIn} target="_blank" rel="noreferrer" className="text-primary text-[10px] font-black uppercase hover:underline">View Profile</a>
                                                    ) : (
                                                        <span className="opacity-30 text-[10px] font-black">N/A</span>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">
                                                        Year {u.yearOfStudy || '?'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-muted-foreground uppercase">{u.branch || 'B.E / B.Tech'}</td>
                                            </>
                                        )}
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(u._id, u.name)}
                                                className="p-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Total Records: {filteredUsers.length}
                        </p>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Live Directory Database Sync</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </MainLayout>
    );
};

export default AdminUserDirectory;
