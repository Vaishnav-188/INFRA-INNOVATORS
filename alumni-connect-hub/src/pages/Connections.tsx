import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
    Users, CheckCircle, XCircle, Clock, Mail, Briefcase, MapPin,
    MessageCircle, Github, Search, Filter, Award, BookOpen,
    Target, MessageSquare, ExternalLink, Sparkles
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';

// ── Mentorship request type (alumni view) ──────────────────────────────────────
interface MentorshipRequest {
    _id: string;
    student: {
        _id: string;
        name: string;
        username: string;
        collegeEmail: string;
        department: string;
        batch: string;
        yearOfStudy: number;
        githubRepo: string;
        projectDomains: string[];
        interests: string[];
        skills: string[];
    };
    domain: string;
    message: string;
    careerGoals?: string;
    skills: string[];
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ALUMNI VIEW — Full Mentorship Management
// ══════════════════════════════════════════════════════════════════════════════
const AlumniConnectionsView = () => {
    const { user } = useAuth();
    const pageRef = usePageTransition();
    const cardsRef = useStaggerReveal(0.05);

    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<MentorshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const fetchRequests = async () => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/mentorship/requests/incoming', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests);
                setFilteredRequests(data.requests.filter((r: MentorshipRequest) => r.status === 'pending'));
            } else {
                toast.error('Failed to load mentorship requests');
            }
        } catch {
            toast.error('Error loading requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchRequests(); }, [user]);

    // Filter logic
    useEffect(() => {
        let result = requests;
        if (selectedStatus !== 'all') result = result.filter(r => r.status === selectedStatus);
        if (selectedDepartment !== 'all') result = result.filter(r => r.student.department === selectedDepartment);
        if (searchTerm) {
            result = result.filter(r =>
                r.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredRequests(result);
    }, [searchTerm, selectedStatus, selectedDepartment, requests]);

    const handleAccept = async (id: string) => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;
        const tid = toast.loading('Accepting mentorship request...');
        try {
            const res = await fetch(`/api/mentorship/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'accepted' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Mentorship request accepted! 🎉', { id: tid });
                fetchRequests();
            } else {
                toast.error(data.message || 'Failed to accept', { id: tid });
            }
        } catch {
            toast.error('Connection error', { id: tid });
        }
    };

    const handleReject = async (id: string) => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;
        const tid = toast.loading('Rejecting request...');
        try {
            const res = await fetch(`/api/mentorship/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'rejected' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Request rejected', { id: tid });
                fetchRequests();
            } else {
                toast.error(data.message || 'Failed to reject', { id: tid });
            }
        } catch {
            toast.error('Connection error', { id: tid });
        }
    };

    const departments = [...new Set(requests.map(r => r.student.department))];
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const acceptedCount = requests.filter(r => r.status === 'accepted').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning/10 text-warning';
            case 'accepted': return 'bg-success/10 text-success';
            case 'rejected': return 'bg-destructive/10 text-destructive';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} />;
            case 'accepted': return <CheckCircle size={16} />;
            case 'rejected': return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Loading Mentorship Requests...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <MainLayout>
            <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">

                {/* ── Header ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Users className="text-primary-foreground" size={24} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight">
                                Mentorship Connections
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">
                                Review student requests • Verify GitHub profiles • Accept or decline
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <GlassCard variant="light" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                                    Pending Requests
                                </p>
                                <p className="text-3xl font-black text-warning flex items-center gap-2">
                                    {pendingCount}
                                    {pendingCount > 0 && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning text-white text-[10px] font-black animate-pulse">
                                            !
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Clock className="text-warning" size={24} />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard variant="light" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                                    Accepted
                                </p>
                                <p className="text-3xl font-black text-success">{acceptedCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle className="text-success" size={24} />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard variant="light" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                                    Total Requests
                                </p>
                                <p className="text-3xl font-black text-primary">{requests.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="text-primary" size={24} />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* ── Filters ── */}
                <GlassCard variant="light" className="p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by name, domain, message..."
                                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <select
                                value={selectedDepartment}
                                onChange={e => setSelectedDepartment(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''} Found
                        </p>
                    </div>
                </GlassCard>

                {/* ── Request Cards ── */}
                <div ref={cardsRef} className="space-y-6">
                    {filteredRequests.map((request) => (
                        <GlassCard
                            key={request._id}
                            variant="light"
                            className="p-6 hover-lift relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
                            <div className="relative">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="flex-1">
                                        {/* Student header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground mb-1">
                                                    {request.student.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    @{request.student.username} • {request.student.collegeEmail}
                                                </p>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs uppercase ${getStatusColor(request.status)}`}>
                                                {getStatusIcon(request.status)}
                                                {request.status}
                                            </div>
                                        </div>

                                        {/* Department / Year */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="text-primary" size={16} />
                                                <span className="text-sm font-bold text-foreground">{request.student.department}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Award className="text-warning" size={16} />
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {request.student.batch} • Year {request.student.yearOfStudy}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Request message */}
                                        <div className="bg-muted/30 rounded-2xl p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="text-primary" size={14} />
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest">
                                                    Domain: {request.domain}
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="text-muted-foreground mt-0.5" size={14} />
                                                <p className="text-sm text-foreground font-medium">{request.message}</p>
                                            </div>
                                            {request.careerGoals && (
                                                <div className="mt-3 pt-3 border-t border-border/50">
                                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Career Goals</p>
                                                    <p className="text-sm text-muted-foreground">{request.careerGoals}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {request.student.projectDomains?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Project Domains</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {request.student.projectDomains.map((d, i) => (
                                                            <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg">{d}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {request.student.interests?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Interests</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {request.student.interests.map((int, i) => (
                                                            <span key={i} className="px-2 py-1 bg-warning/10 text-warning text-[10px] font-bold rounded-lg">{int}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {request.student.githubRepo && (
                                                <a
                                                    href={request.student.githubRepo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors"
                                                >
                                                    <Github size={16} />
                                                    Verify GitHub
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}

                                            {request.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAccept(request._id)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-bold hover:bg-success/90 transition-colors"
                                                    >
                                                        <CheckCircle size={16} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request._id)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:bg-destructive/90 transition-colors"
                                                    >
                                                        <XCircle size={16} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {request.status === 'accepted' && (
                                                <Link to={`/mentorship-chat/${request._id}`}>
                                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                                                        <Sparkles size={16} />
                                                        View AI Roadmap
                                                    </button>
                                                </Link>
                                            )}

                                            <div className="ml-auto text-right">
                                                <p className="text-xs text-muted-foreground">
                                                    Requested {new Date(request.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Empty state */}
                {filteredRequests.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                            <Users className="text-muted-foreground" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2">No Requests Found</h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedStatus === 'pending'
                                ? 'No pending mentorship requests at the moment'
                                : 'Try adjusting your filters or search query'}
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT VIEW — Their sent connections / mentorship requests
// ══════════════════════════════════════════════════════════════════════════════
const StudentConnectionsView = () => {
    const { user } = useAuth();
    const pageRef = usePageTransition();
    const [connections, setConnections] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchConnections();
        fetchStats();
    }, []);

    const fetchConnections = async (status = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const q = status ? `?status=${status}` : '';
            const res = await fetch(`/api/connections${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setConnections(data.connections);
        } catch {
            toast.error('Failed to load connections');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const res = await fetch('/api/connections/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch { }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const map: Record<string, string> = { all: '', pending: 'pending', accepted: 'accepted', rejected: 'rejected' };
        fetchConnections(map[value]);
    };

    const getStatusStyles = (status: string) => {
        const v: Record<string, string> = {
            pending: 'text-warning bg-warning/10',
            accepted: 'text-success bg-success/10',
            rejected: 'text-destructive bg-destructive/10'
        };
        return v[status] || v.pending;
    };

    return (
        <MainLayout>
            <div ref={pageRef} className="container mx-auto px-6 py-24 md:px-20 max-w-7xl pb-20">
                <div className="mb-12">
                    <h1 className="text-5xl font-black text-foreground tracking-tight mb-4">
                        MY <span className="text-primary italic">CONNECTIONS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                        Track your mentor requests and accepted mentorships.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <GlassCard variant="light" className="p-6 text-center">
                        <p className="text-3xl font-black text-primary">{stats.total}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                    </GlassCard>
                    <GlassCard variant="light" className="p-6 text-center">
                        <p className="text-3xl font-black text-warning">{stats.pending}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
                    </GlassCard>
                    <GlassCard variant="light" className="p-6 text-center">
                        <p className="text-3xl font-black text-success">{stats.accepted}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accepted</p>
                    </GlassCard>
                    <GlassCard variant="light" className="p-6 text-center">
                        <p className="text-3xl font-black text-destructive">{stats.rejected}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rejected</p>
                    </GlassCard>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
                    {['all', 'pending', 'accepted', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-foreground text-background shadow-xl'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    </div>
                ) : connections.length === 0 ? (
                    <GlassCard variant="default" className="p-20 text-center">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-black text-foreground mb-2">No Connections Found</h3>
                        <p className="text-muted-foreground">Start connecting with alumni today!</p>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {connections.map((connection: any) => {
                            const person = connection.alumni;
                            if (!person) return null;
                            return (
                                <GlassCard key={connection._id} variant="default" className="p-8 group hover-up">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                                            <Users className="text-muted-foreground" size={24} />
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusStyles(connection.status)}`}>
                                            {connection.status}
                                        </span>
                                    </div>
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-black text-foreground mb-1">{person.name}</h3>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {person.jobRole || 'Alumni'}
                                        </p>
                                    </div>
                                    {connection.message && (
                                        <div className="mb-6 p-4 bg-muted/40 rounded-2xl border border-border/50">
                                            <p className="text-sm text-muted-foreground font-medium italic">"{connection.message}"</p>
                                        </div>
                                    )}
                                    <div className="space-y-3 mb-8">
                                        {person.currentCompany && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                                                <Briefcase size={16} className="text-primary" />
                                                {person.currentCompany}
                                            </div>
                                        )}
                                        {person.location && (
                                            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                                <MapPin size={16} className="text-muted-foreground/50" />
                                                {person.location}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-6 border-t border-border flex items-center justify-between">
                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                            Connected {new Date(connection.createdAt).toLocaleDateString()}
                                        </p>
                                        {connection.status === 'accepted' ? (
                                            <Link
                                                to={`/mentorship-chat/${connection._id}`}
                                                className="w-10 h-10 bg-primary/10 hover:bg-primary rounded-xl flex items-center justify-center text-primary hover:text-primary-foreground transition-all group"
                                            >
                                                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                                            </Link>
                                        ) : (
                                            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground cursor-not-allowed opacity-50">
                                                <Mail size={18} />
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Route to the right view based on role
// ══════════════════════════════════════════════════════════════════════════════
const Connections = () => {
    const { user } = useAuth();

    if (user?.role === 'alumni') return <AlumniConnectionsView />;
    return <StudentConnectionsView />;
};

export default Connections;
