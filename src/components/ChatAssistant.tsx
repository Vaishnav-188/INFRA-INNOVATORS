import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChatAssistant = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadChatHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/history?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                const formattedMessages = [];
                data.chatHistory.forEach(chat => {
                    formattedMessages.push({
                        type: 'user',
                        content: chat.message,
                        timestamp: chat.createdAt
                    });
                    formattedMessages.push({
                        type: 'bot',
                        content: chat.response,
                        timestamp: chat.createdAt
                    });
                });
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            type: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: inputMessage })
            });

            const data = await response.json();
            if (data.success) {
                const botMessage = {
                    type: 'bot',
                    content: data.response,
                    timestamp: data.timestamp
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/chat/history', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMessages([]);
            toast({
                title: "Success",
                description: "Chat history cleared"
            });
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Chat Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen && (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl animate-bounce"
                    >
                        <MessageCircle className="h-8 w-8 text-white" />
                    </Button>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed bottom-6 right-6 w-96 h-[600px] z-50 bg-slate-900 border-white/20 shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Alumni Connect Assistant</h3>
                                <p className="text-white/80 text-xs">Always here to help!</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearHistory}
                                className="text-white hover:bg-white/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <Bot className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                                <p className="text-gray-300 text-sm">
                                    Hello! I'm your AI assistant. Ask me about events, jobs, alumni connections, or anything else!
                                </p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.type === 'bot' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[75%] rounded-lg p-3 ${message.type === 'user'
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                            : 'bg-white/10 text-gray-100 border border-white/20'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <span className="text-xs opacity-70 mt-1 block">
                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {message.type === 'user' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-slate-900 border-t border-white/20">
                        <div className="flex gap-2">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                                placeholder="Type your message..."
                                disabled={loading}
                                className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={loading || !inputMessage.trim()}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </>
    );
};

export default ChatAssistant;
