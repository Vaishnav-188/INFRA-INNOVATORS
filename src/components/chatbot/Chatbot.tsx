import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { gsap } from '@/hooks/useGSAP';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Alumni Hub assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Role-based suggestions
  const getSuggestions = () => {
    if (!user) {
      return [
        'How do I register?',
        'What is Alumni Hub?',
        'Login help',
      ];
    }
    switch (user.role) {
      case 'student':
        return [
          'Upcoming events',
          'Job openings',
          'Become an alumni',
        ];
      case 'alumni':
        return [
          'Post a job',
          'Mentorship info',
          'Donation options',
        ];
      case 'admin':
        return [
          'Pending approvals',
          'User management',
          'Analytics',
        ];
      default:
        return ['Help', 'Contact support'];
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Animate panel open/close
  useEffect(() => {
    if (panelRef.current) {
      if (isOpen) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }
        );
      }
    }
  }, [isOpen]);

  // Simulate bot response
  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('register') || msg.includes('sign up')) {
      return "To register, click 'Join Hub' in the navigation and select your role (Student, Alumni, or Admin). Students use their college email, and Alumni can register with their professional details.";
    }
    if (msg.includes('event')) {
      return "You can find all upcoming events on the Events page. Alumni can post new events, while students can view and RSVP to them.";
    }
    if (msg.includes('job')) {
      return "Check out the Jobs page for current openings posted by our alumni network. Alumni members can also post job opportunities for students.";
    }
    if (msg.includes('donation') || msg.includes('donate')) {
      return "Alumni can contribute to the college through our donation portal. You can specify the purpose of your donation and choose from various payment methods.";
    }
    if (msg.includes('mentor')) {
      return "Our mentorship program connects students with experienced alumni. Alumni can sign up as mentors and students can request mentorship sessions.";
    }
    if (msg.includes('verify') || msg.includes('alumni status')) {
      return "Students can apply for alumni verification after graduation. Submit your details on the home page and an admin will review your application.";
    }
    if (msg.includes('help') || msg.includes('support')) {
      return "I'm here to help! You can ask me about events, jobs, donations, mentorship, or account-related questions. For technical issues, please contact support@alumnihub.edu";
    }

    return "I understand you're asking about: \"" + userMessage + "\". Could you please provide more details or try one of the suggested questions below?";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
          bg-primary text-primary-foreground shadow-xl shadow-primary/30
          flex items-center justify-center transition-all duration-300
          hover:scale-110 hover:shadow-2xl hover:shadow-primary/40
          ${isOpen ? 'rotate-90' : ''}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] 
            glass-solid rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold">Alumni Hub Assistant</h3>
                <p className="text-xs opacity-80">Always here to help</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[320px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce-soft" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce-soft" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce-soft" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {getSuggestions().map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-muted hover:bg-primary hover:text-primary-foreground 
                  px-3 py-1.5 rounded-full transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none 
                  focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground 
                  flex items-center justify-center disabled:opacity-50 
                  disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
