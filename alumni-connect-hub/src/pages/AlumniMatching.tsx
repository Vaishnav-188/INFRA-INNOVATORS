import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Users, Sparkles, MapPin, Briefcase, GraduationCap, MessageCircle, Link2, Github, Linkedin, Globe, CheckCircle2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from '@/components/ui/GlassCard';
import { usePageTransition } from '@/hooks/useGSAP';

// Premium Domain Categories
const DOMAINS = [
    'Artificial Intelligence', 'Web Development', 'Mobile Apps',
    'Cloud Computing', 'Cybersecurity', 'Data Science',
    'Product Management', 'UI/UX Design', 'BlockChain'
];

const AlumniMatching = () => {
    const { user } = useAuth();
    const pageRef = usePageTransition();
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchInterests, setSearchInterests] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [connectionMessage, setConnectionMessage] = useState('');
    const [myConnections, setMyConnections] = useState([]);

    useEffect(() => {
        fetchMatchingAlumni();
        fetchMyConnections();
    }, []);

    const fetchMatchingAlumni = async (interests = '', domain = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('alumni_hub_token');
            let url = `/api/connections/match`;
            const params = new URLSearchParams();
            if (interests) params.append('interests', interests);
            if (domain) params.append('domain', domain);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setAlumni(data.alumni);
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            toast.error("Failed to load matching alumni");
        } finally {
            setLoading(false);
        }
    };

    const fetchMyConnections = async () => {
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const response = await fetch('/api/connections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setMyConnections(data.connections);
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const handleSearch = () => {
        fetchMatchingAlumni(searchInterests, selectedDomain);
    };

    const handleConnect = async (alumniId) => {
        try {
            const token = localStorage.getItem('alumni_hub_token');
            const response = await fetch('/api/connections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    alumniId,
                    message: connectionMessage,
                    interests: searchInterests.split(',').map(i => i.trim()).filter(Boolean)
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Connection request sent successfully!");
                setConnectionMessage('');
                setSelectedAlumni(null);
                fetchMyConnections();
            } else {
                toast.error(data.error || "Failed to send request");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        }
    };

    const isAlreadyConnected = (alumniId) => {
        return myConnections.some(conn => conn.alumni?._id === alumniId || conn.alumni === alumniId);
    };

    return (
        <MainLayout>
            <div ref={pageRef} className="container mx-auto px-6 py-24 md:px-20 max-w-7xl pb-20">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-black text-foreground tracking-tight mb-4">
                        FIND YOUR <span className="text-primary italic">MENTOR</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                        Connect with industry experts who graduated from our college.
                        Filter by your preferred domain to find the perfect match.
                    </p>
                </div>

                {/* Filter Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                    <GlassCard variant="default" className="lg:col-span-1 p-6 h-fit sticky top-28">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 px-1">
                            Domain Filter
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setSelectedDomain(''); fetchMatchingAlumni(searchInterests, ''); }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${!selectedDomain ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                                All Domains
                            </button>
                            {DOMAINS.map(domain => (
                                <button
                                    key={domain}
                                    onClick={() => { setSelectedDomain(domain); fetchMatchingAlumni(searchInterests, domain); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedDomain === domain ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted text-muted-foreground'}`}
                                >
                                    {domain}
                                </button>
                            ))}
                        </div>
                    </GlassCard>

                    <div className="lg:col-span-3 space-y-8">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search by skills (e.g. React, Python, AWS)..."
                                className="w-full pl-16 pr-32 py-6 bg-card border-none rounded-3xl text-foreground font-bold shadow-xl focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                                value={searchInterests}
                                onChange={(e) => setSearchInterests(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-foreground text-background rounded-2xl font-black text-xs hover:scale-95 active:scale-90 transition-all shadow-lg"
                            >
                                SEARCH
                            </button>
                        </div>

                        {/* Results Grid */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-muted-foreground font-bold animate-pulse">Matching you with mentors...</p>
                            </div>
                        ) : alumni.length === 0 ? (
                            <GlassCard variant="default" className="p-20 text-center">
                                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                                <h3 className="text-xl font-black text-foreground mb-2">No Matching Alumni Found</h3>
                                <p className="text-muted-foreground">Try broadening your search or selecting a different domain.</p>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {alumni.map((alum) => (
                                    <GlassCard key={alum._id} variant="default" className="p-8 group hover-up">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                                                <Users className="text-muted-foreground" size={32} />
                                            </div>
                                            <Badge className="bg-success/10 text-success border-none py-1.5 px-3 rounded-xl font-bold text-[10px] tracking-widest flex items-center gap-1">
                                                <Sparkles size={10} /> {alum.matchScore || 0}% MATCH
                                            </Badge>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
                                                {alum.name}
                                                {alum.isVerified && <CheckCircle2 className="text-primary" size={18} />}
                                            </h3>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                                {alum.jobRole} @ <span className="text-foreground">{alum.currentCompany}</span>
                                            </p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                                <MapPin size={16} className="text-primary" />
                                                {alum.location || 'Remote'}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(alum.skills || []).slice(0, 4).map(skill => (
                                                    <span key={skill} className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-foreground">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-6 border-t border-border">
                                            {isAlreadyConnected(alum._id) ? (
                                                <div className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-black text-xs text-center flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={16} /> CONNECTED
                                                </div>
                                            ) : (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button
                                                            onClick={() => setSelectedAlumni(alum)}
                                                            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            REQUEST MENTORSHIP
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="glass-solid border-none p-10 max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-3xl font-black text-foreground mb-2">Connect with {alum.name}</DialogTitle>
                                                            <DialogDescription className="text-muted-foreground font-medium text-lg mb-6">
                                                                Briefly explain your goals and how {alum.name} can help you.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6">
                                                            <Textarea
                                                                placeholder="I'm interested in web development and would love to hear about your experience at..."
                                                                className="input-solid min-h-[150px]"
                                                                value={connectionMessage}
                                                                onChange={(e) => setConnectionMessage(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleConnect(alum._id)}
                                                                className="w-full py-5 btn-primary font-black"
                                                            >
                                                                SEND REQUEST
                                                            </button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}

                                            <div className="flex gap-2">
                                                {alum.linkedIn && (
                                                    <a href={alum.linkedIn} target="_blank" className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                                        <Linkedin size={20} />
                                                    </a>
                                                )}
                                                {alum.github && (
                                                    <a href={alum.github} target="_blank" className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                                        <Github size={20} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AlumniMatching;
