import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import {
    Send, ArrowLeft, Github, Briefcase, GraduationCap, User
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        username: string;
        role: string;
    };
    receiver: {
        _id: string;
        name: string;
        username: string;
        role: string;
    };
    message: string;
    read: boolean;
    createdAt: string;
}

interface Mentorship {
    _id: string;
    student: any;
    alumni: any;
    domain: string;
    status: string;
}

const MentorshipChat = () => {
    const { mentorshipId } = useParams<{ mentorshipId: string }>();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const pageRef = usePageTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [mentorship, setMentorship] = useState<Mentorship | null>(null);
    const [otherUser, setOtherUser] = useState<any>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch mentorship details and messages
    const fetchChatData = async () => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token || !mentorshipId) return;

        setIsLoading(true);
        try {
            // Fetch messages
            const messagesResponse = await fetch(`/api/mentorship/chat/${mentorshipId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const messagesData = await messagesResponse.json();

            let tempOtherUser = null;

            if (messagesData.success) {
                setMessages(messagesData.messages);

                // Determine other user from first message
                if (messagesData.messages.length > 0) {
                    const firstMsg = messagesData.messages[0];
                    tempOtherUser = firstMsg.sender._id === user?.id ? firstMsg.receiver : firstMsg.sender;
                    setOtherUser(tempOtherUser);
                }
            }

            // If no other user yet (no messages), try to fetch relationship details
            if (!tempOtherUser) {
                // Try mentorship requests first
                const mentorshipResponse = await fetch(`/api/mentorship/requests`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const mentorshipData = await mentorshipResponse.json();
                if (mentorshipData.success) {
                    const currentMentorship = mentorshipData.requests.find((r: any) => r._id === mentorshipId);
                    if (currentMentorship) {
                        setMentorship(currentMentorship);
                        tempOtherUser = user?.role === 'student' ? currentMentorship.alumni : currentMentorship.student;
                        setOtherUser(tempOtherUser);
                    }
                }

                // If still not found, try connections
                if (!tempOtherUser) {
                    const connectionsResponse = await fetch(`/api/connections`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const connectionsData = await connectionsResponse.json();
                    if (connectionsData.success) {
                        const currentConnection = connectionsData.connections.find((c: any) => c._id === mentorshipId);
                        if (currentConnection) {
                            tempOtherUser = user?.role === 'student' ? currentConnection.alumni : currentConnection.student;
                            setOtherUser(tempOtherUser);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching chat data:', error);
            toast.error('Error loading chat');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data without showing loading spinner (for polling)
    const fetchChatDataSilent = async () => {
        const token = localStorage.getItem('alumni_hub_token');
        if (!token || !mentorshipId) return;

        try {
            // Fetch messages
            const messagesResponse = await fetch(`/api/mentorship/chat/${mentorshipId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const messagesData = await messagesResponse.json();

            if (messagesData.success) {
                setMessages(messagesData.messages);
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    };

    useEffect(() => {
        if (user && mentorshipId) {
            // Initial fetch with loading state
            fetchChatData();

            // Safety timeout - ensure loading state doesn't hang forever
            const loadingTimeout = setTimeout(() => {
                if (isLoading) {
                    setIsLoading(false);
                    toast.error('Chat loading timeout. Please refresh.');
                }
            }, 10000); // 10 second timeout

            // Poll for new messages every 5 seconds (without loading spinner)
            const interval = setInterval(fetchChatDataSilent, 5000);

            return () => {
                clearInterval(interval);
                clearTimeout(loadingTimeout);
            };
        }
    }, [user, mentorshipId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || isSending) return;

        const token = localStorage.getItem('alumni_hub_token');
        if (!token || !mentorshipId) return;

        setIsSending(true);
        try {
            const response = await fetch(`/api/mentorship/chat/${mentorshipId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: newMessage.trim() })
            });

            const data = await response.json();

            if (data.success) {
                setMessages([...messages, data.chatMessage]);
                setNewMessage('');
                scrollToBottom();
            } else {
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Loading Chat...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <MainLayout>
            <div ref={pageRef} className="pt-20 px-0 max-w-7xl mx-auto pb-0 h-screen flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-16 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-muted rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {otherUser && (
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black">
                                    {otherUser.name?.charAt(0) || <User size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">{otherUser.name}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        @{otherUser.username} • {otherUser.role === 'alumni' ? otherUser.currentCompany || 'Alumni' : `${otherUser.department} Student`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {otherUser?.githubRepo && (
                            <a
                                href={otherUser.githubRepo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors"
                            >
                                <Github size={16} />
                                GitHub
                            </a>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                                <Send className="text-muted-foreground" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2">No Messages Yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Start the conversation by sending a message!
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            // Identify if the current user is the sender
                            const isMe = String(msg.sender?._id || msg.sender) === String(user?.id);

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div className={`px-4 py-3 rounded-2xl ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-muted text-foreground rounded-bl-none'
                                            }`}>
                                            <p className="text-sm font-medium whitespace-pre-wrap break-words">
                                                {msg.message}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground px-2">
                                            {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type  your message..."
                            disabled={isSending}
                            className="flex-1 h-12 px-4 bg-muted border-2 border-transparent rounded-xl font-medium text-sm outline-none focus:border-primary/30 transition-all placeholder:text-muted-foreground/50 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default MentorshipChat;
