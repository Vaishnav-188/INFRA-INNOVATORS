import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { MoreHorizontal, Edit3, Bookmark, Trash2, Image, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  author: string;
  authorRole: string;
  time: string;
  eventDate?: string;
  text: string;
  image?: string;
  isSaved: boolean;
}

// Demo events data
const initialEvents: Event[] = [
  {
    id: '1',
    author: 'Dr. Sarah Vance',
    authorRole: 'alumni',
    time: '2 days ago',
    eventDate: '2026-02-15',
    text: 'Excited to announce our Annual Alumni Meet 2026! Join us for a day of networking, nostalgia, and celebrating our journey. All batches welcome!',
    image: 'https://picsum.photos/600/400?random=1',
    isSaved: false,
  },
  {
    id: '2',
    author: 'Marcus Sterling',
    authorRole: 'alumni',
    time: '5 days ago',
    eventDate: '2026-03-01',
    text: 'Workshop on "From Campus to Corporate: Mastering the Transition". Perfect for final year students. Limited seats, register now!',
    isSaved: false,
  },
  {
    id: '3',
    author: 'College Admin',
    authorRole: 'admin',
    time: '1 week ago',
    eventDate: '2026-02-28',
    text: 'Campus Placement Drive 2026 - Top companies including Google, Microsoft, Amazon will be visiting. Prepare your resumes!',
    image: 'https://picsum.photos/600/400?random=2',
    isSaved: true,
  },
];

const Events = () => {
  const { user } = useAuth();
  const pageRef = usePageTransition();
  
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const canPost = user?.role === 'alumni' || user?.role === 'admin';

  const handleAddPost = () => {
    if (!newPostText.trim()) {
      toast.error('Please enter event details');
      return;
    }

    if (isEditing && editPostId) {
      setEvents(events.map(e => 
        e.id === editPostId 
          ? { ...e, text: newPostText, image: newPostImage, eventDate } 
          : e
      ));
      toast.success('Event updated!');
    } else {
      const newEvent: Event = {
        id: Date.now().toString(),
        author: user?.username || 'Anonymous',
        authorRole: user?.role || 'alumni',
        time: 'Just now',
        eventDate,
        text: newPostText,
        image: newPostImage || undefined,
        isSaved: false,
      };
      setEvents([newEvent, ...events]);
      toast.success('Event posted!');
    }

    resetModal();
  };

  const resetModal = () => {
    setNewPostText('');
    setNewPostImage('');
    setEventDate('');
    setShowModal(false);
    setIsEditing(false);
    setEditPostId(null);
  };

  const handleEdit = (event: Event) => {
    setIsEditing(true);
    setEditPostId(event.id);
    setNewPostText(event.text);
    setNewPostImage(event.image || '');
    setEventDate(event.eventDate || '');
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success('Event deleted');
    setOpenDropdown(null);
  };

  const handleSave = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, isSaved: !e.isSaved } : e
    ));
    setOpenDropdown(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <MainLayout>
      <div ref={pageRef} className="pt-24 pb-12 px-4 flex justify-center">
        <div className="feed-container">
          {/* Post Creator */}
          {canPost && (
            <div className="glass-card rounded-xl p-5 mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 text-left px-6 py-3 rounded-full bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition"
                >
                  Post Your Content Here.....
                </button>
              </div>
            </div>
          )}

          {/* Events Feed */}
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="glass-card rounded-xl border border-border relative">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {event.author.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{event.author}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {event.time}
                          {event.eventDate && (
                            <>
                              {' '}•{' '}
                              <span className="text-primary">
                                Event: {event.eventDate}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === event.id ? null : event.id)}
                        className="p-1.5 hover:bg-muted rounded-full transition"
                      >
                        <MoreHorizontal size={20} className="text-muted-foreground" />
                      </button>

                      {openDropdown === event.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                          {canPost && (
                            <button
                              onClick={() => handleEdit(event)}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-3 transition"
                            >
                              <Edit3 size={16} /> Edit Post
                            </button>
                          )}
                          <button
                            onClick={() => handleSave(event.id)}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-foreground hover:bg-muted flex items-center gap-3 transition"
                          >
                            <Bookmark size={16} className={event.isSaved ? 'fill-primary text-primary' : ''} />
                            {event.isSaved ? 'Saved' : 'Save Post'}
                          </button>
                          {(user?.role === 'admin' || event.author === user?.username) && (
                            <>
                              <div className="h-[1px] bg-border my-1 mx-2" />
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 flex items-center gap-3 transition"
                              >
                                <Trash2 size={16} /> Delete Post
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{event.text}</p>
                </div>
                {event.image && (
                  <div className="border-t border-border">
                    <img
                      src={event.image}
                      alt="Event"
                      className="w-full h-auto max-h-[450px] object-cover rounded-b-xl"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">No events yet</p>
              <p className="text-sm">Be the first to post an event!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
              <h2 className="font-bold text-foreground">
                {isEditing ? 'Edit Post' : 'Create Event Post'}
              </h2>
              <button
                onClick={resetModal}
                className="p-1 hover:bg-card rounded-full transition"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="w-full h-40 p-3 outline-none resize-none text-lg border border-border rounded-xl mb-4 focus:border-primary transition"
                placeholder="What's the update?"
              />

              {newPostImage && (
                <div className="relative mb-4 group">
                  <img
                    src={newPostImage}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={() => setNewPostImage('')}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-5">
                <div className="flex gap-4 items-center">
                  <label className="cursor-pointer p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition">
                    <Image size={24} />
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                  <div className="flex flex-col">
                    <span className="text-label text-muted-foreground">Event Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="text-sm border-none outline-none text-primary font-semibold bg-transparent"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAddPost}
                  className="bg-primary text-primary-foreground px-8 py-2.5 rounded-full font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition"
                >
                  {isEditing ? 'Save Changes' : 'Post Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Events;
