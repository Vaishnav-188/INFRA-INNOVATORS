import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, CheckCircle, XCircle, Clock, Mail, Briefcase, MapPin, GraduationCap, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { usePageTransition } from '@/hooks/useGSAP';

const Connections = () => {
    const { user } = useAuth();
    const pageRef = usePageTransition();
    const [connections, setConnections] = useState([]);
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
            const queryParams = status ? `?status=${status}` : '';

            const response = await fetch(`http://localhost:5000/api/connections${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
            toast.error("Failed to load connections");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const response = await fetch('http://localhost:5000/api/connections/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleStatusUpdate = async (connectionId, status) => {
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const response = await fetch(`http://localhost:5000/api/connections/${connectionId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Connection ${status} successfully`);
                fetchConnections(activeTab === 'all' ? '' : activeTab);
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating connection:', error);
            toast.error("Failed to update connection");
        }
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        const statusMap = {
            'all': '',
            'pending': 'pending',
            'accepted': 'accepted',
            'rejected': 'rejected'
        };
        fetchConnections(statusMap[value]);
    };

    const getStatusStyles = (status) => {
        const variants = {
            pending: 'text-warning bg-warning/10',
            accepted: 'text-success bg-success/10',
            rejected: 'text-destructive bg-destructive/10'
        };
        return variants[status] || variants.pending;
    };

    return (
        <MainLayout>
            <div ref={pageRef} className="container mx-auto px-6 py-24 md:px-20 max-w-7xl pb-20">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-black text-foreground tracking-tight mb-4">
                        MY <span className="text-primary italic">CONNECTIONS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                        Manage your {user?.role === 'student' ? 'mentors' : 'student mentees'} and keep track of your requests.
                    </p>
                </div>

                {/* Stats Summary */}
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

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
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

                {/* Connections Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    </div>
                ) : connections.length === 0 ? (
                    <GlassCard variant="default" className="p-20 text-center">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-black text-foreground mb-2">No Connections Found</h3>
                        <p className="text-muted-foreground">Start connecting with {user?.role === 'student' ? 'alumni' : 'students'} today!</p>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {connections.map((connection) => {
                            const person = user?.role === 'student' ? connection.alumni : connection.student;
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
                                            {user?.role === 'student' ? (person.jobRole || 'Alumni') : (person.department || 'Student')}
                                        </p>
                                    </div>

                                    {connection.message && (
                                        <div className="mb-6 p-4 bg-muted/40 rounded-2xl border border-border/50">
                                            <p className="text-sm text-muted-foreground font-medium italic">"{connection.message}"</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 mb-8">
                                        {user?.role === 'student' && person.currentCompany && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                                                <Briefcase size={16} className="text-primary" />
                                                {person.currentCompany}
                                            </div>
                                        )}
                                        {user?.role === 'alumni' && person.collegeEmail && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                                                <Mail size={16} className="text-primary" />
                                                {person.collegeEmail}
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
                                        {user?.role === 'alumni' && connection.status === 'pending' ? (
                                            <div className="flex gap-4 w-full">
                                                <button
                                                    onClick={() => handleStatusUpdate(connection._id, 'accepted')}
                                                    className="flex-1 py-4 bg-success text-success-foreground rounded-2xl font-black text-xs hover:scale-[1.02] transition-all shadow-lg shadow-success/20"
                                                >
                                                    ACCEPT
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(connection._id, 'rejected')}
                                                    className="flex-1 py-4 bg-destructive text-destructive-foreground rounded-2xl font-black text-xs hover:scale-[1.02] transition-all"
                                                >
                                                    REJECT
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                                    Connected {new Date(connection.createdAt).toLocaleDateString()}
                                                </p>
                                                <button className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                                    <Mail size={18} />
                                                </button>
                                            </>
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

export default Connections;
