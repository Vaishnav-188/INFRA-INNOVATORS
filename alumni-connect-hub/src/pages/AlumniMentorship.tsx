import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition, useStaggerReveal } from '@/hooks/useGSAP';
import {
    Github, Search, Filter, Award, BookOpen, Sparkles,
    CheckCircle, XCircle, Clock, Users, Target, MessageSquare, ExternalLink, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

const AlumniMentorship = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const pageRef = usePageTransition();
    const cardsRef = useStaggerReveal(0.05);

    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<MentorshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    // Fetch mentorship requests
    const fetchRequests = async () => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/mentorship/requests/incoming', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                setRequests(data.requests);
                setFilteredRequests(data.requests.filter((r: MentorshipRequest) => r.status === 'pending'));
            } else {
                toast.error('Failed to load mentorship requests');
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Error loading requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchRequests();
    }, [user]);

    // Filter requests based on search and filters
    useEffect(() => {
        let result = requests;

        // Status filter
        if (selectedStatus !== 'all') {
            result = result.filter(req => req.status === selectedStatus);
        }

        // Department filter
        if (selectedDepartment !== 'all') {
            result = result.filter(req => req.student.department === selectedDepartment);
        }

        // Search filter
        if (searchTerm) {
            result = result.filter(req =>
                req.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRequests(result);
    }, [searchTerm, selectedStatus, selectedDepartment, requests]);

    // Redirect if not alumni
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'alumni')) {
            navigate('/signin');
        }
    }, [user, navigate, authLoading]);

    const handleAcceptRequest = async (requestId: string) => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;

        const loadingToast = toast.loading('Accepting mentorship request...');

        try {
            const response = await fetch(`/api/mentorship/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Mentorship request accepted!', { id: loadingToast });
                fetchRequests(); // Refresh the list
            } else {
                toast.error(data.message || 'Failed to accept request', { id: loadingToast });
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.error('Connection error', { id: loadingToast });
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token) return;

        const loadingToast = toast.loading('Rejecting mentorship request...');

        try {
            const response = await fetch(`/api/mentorship/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'rejected' })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Request rejected', { id: loadingToast });
                fetchRequests(); // Refresh the list
            } else {
                toast.error(data.message || 'Failed to reject request', { id: loadingToast });
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Connection error', { id: loadingToast });
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Loading Mentorship Requests...
                    </p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'alumni') {
        return null;
    }

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

    return (
        <MainLayout>
            <div ref={pageRef} className="pt-24 px-6 md:px-20 max-w-7xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Users className="text-primary-foreground" size={24} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight">
                                Mentorship Requests
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">
                                Review student requests • Verify GitHub profiles • Accept or decline
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <GlassCard variant="light" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                                    Pending Requests
                                </p>
                                <p className="text-3xl font-black text-warning">{pendingCount}</p>
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

                {/* Filters */}
                <GlassCard variant="light" className="p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, domain, message..."
                                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-muted/50 border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Department Filter */}
                        <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
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

                {/* Requests Grid */}
                <div ref={cardsRef} className="space-y-6">
                    {filteredRequests.map((request) => (
                        <GlassCard
                            key={request._id}
                            variant="light"
                            className="p-6 hover-lift relative overflow-hidden"
                        >
                            {/* Gradient Overlay */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>

                            <div className="relative">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Student Info */}
                                    <div className="flex-1">
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

                                        {/* Request Details */}
                                        <div className="bg-muted/30 rounded-2xl p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="text-primary" size={14} />
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest">
                                                    Domain: {request.domain}
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="text-muted-foreground mt-0.5" size={14} />
                                                <p className="text-sm text-foreground font-medium">
                                                    {request.message}
                                                </p>
                                            </div>
                                            {request.careerGoals && (
                                                <div className="mt-3 pt-3 border-t border-border/50">
                                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                                                        Career Goals
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {request.careerGoals}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Skills & Interests */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {request.student.projectDomains && request.student.projectDomains.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                                                        Project Domains
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {request.student.projectDomains.map((domain, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg"
                                                            >
                                                                {domain}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {request.student.interests && request.student.interests.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                                                        Interests
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {request.student.interests.map((interest, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-warning/10 text-warning text-[10px] font-bold rounded-lg"
                                                            >
                                                                {interest}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
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
                                                        onClick={() => handleAcceptRequest(request._id)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-xl text-sm font-bold hover:bg-success/90 transition-colors"
                                                    >
                                                        <CheckCircle size={16} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request._id)}
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
                                                        <MessageCircle size={16} />
                                                        Message Student
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

                {/* Empty State */}
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

export default AlumniMentorship;
