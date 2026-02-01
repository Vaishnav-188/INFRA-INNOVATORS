import { useState, useEffect } from 'react';
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
// Demo events data removed - using live database values

const Events = () => {
  const { user } = useAuth();
  const pageRef = usePageTransition();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventType, setEventType] = useState('networking');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const canPost = user?.role === 'alumni' || user?.role === 'admin';

  const handleAddPost = async () => {
    if (!newPostText.trim() || !eventTitle.trim()) {
      toast.error('Please enter event title and details');
      return;
    }

    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading(isEditing ? 'Updating event...' : 'Posting new event...');

    try {
      const response = await fetch(`http://localhost:5000/api/events${isEditing ? `/${editPostId}` : ''}`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventTitle,
          description: newPostText,
          date: eventDate,
          venue: eventVenue || 'Virtual',
          eventType: eventType,
          imageUrl: newPostImage
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isEditing ? 'Event updated!' : 'Event posted successfully!', { id: tid });
        fetchEvents();
        resetModal();
      } else {
        toast.error(data.message || 'Operation failed', { id: tid });
      }
    } catch (error) {
      toast.error('Connection error', { id: tid });
    }
  };

  const resetModal = () => {
    setNewPostText('');
    setEventTitle('');
    setEventVenue('');
    setNewPostImage('');
    setEventDate('');
    setEventType('networking');
    setShowModal(false);
    setIsEditing(false);
    setEditPostId(null);
  };

  const handleEdit = (event: any) => {
    setIsEditing(true);
    setEditPostId(event._id);
    setEventTitle(event.title);
    setNewPostText(event.description);
    setEventVenue(event.venue);
    setEventType(event.eventType || 'networking');
    setEventDate(event.date ? event.date.split('T')[0] : '');
    setNewPostImage(event.imageUrl || '');
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('alumni_hub_token');
    try {
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Event deleted');
        fetchEvents();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Connection error');
    }
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
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Gathering Events...</p>
              </div>
            ) : events.map((event) => (
              <div key={event._id} className="glass-card rounded-xl border border-border relative overflow-hidden hover:border-primary/20 transition-all duration-300">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner uppercase tracking-widest">
                        {event.organizer?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-foreground uppercase tracking-tight">{event.organizer?.name || 'Anonymous'}</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                          {new Date(event.createdAt).toLocaleDateString()}
                          {event.date && (
                            <>
                              <span className="w-1 h-1 bg-border rounded-full" />
                              <span className="text-primary">
                                DATE: {new Date(event.date).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === event._id ? null : event._id)}
                        className="p-2 hover:bg-muted rounded-full transition"
                      >
                        <MoreHorizontal size={20} className="text-muted-foreground" />
                      </button>

                      {openDropdown === event._id && (
                        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-2xl z-50 py-2 animate-fade-in shadow-primary/10">
                          {(user?.role === 'admin' || (event.organizer?._id === user?.id || event.organizer === user?.id)) && (
                            <button
                              onClick={() => handleEdit(event)}
                              className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-3 transition"
                            >
                              <Edit3 size={14} /> EDIT EVENT
                            </button>
                          )}
                          {(user?.role === 'admin' || (event.organizer?._id === user?.id || event.organizer === user?.id)) && (
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 flex items-center gap-3 transition"
                            >
                              <Trash2 size={14} /> DELETE EVENT
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-foreground mb-1">{event.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-3">{event.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border">
                      {event.eventType || 'Networking'}
                    </div>
                    {event.venue && (
                      <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest border border-primary/10">
                        {event.venue}
                      </div>
                    )}
                  </div>
                </div>
                {event.imageUrl && (
                  <div className="border-t border-border">
                    <img
                      src={event.imageUrl}
                      alt="Event"
                      className="w-full h-auto max-h-[450px] object-cover rounded-b-xl"
                    />
                  </div>
                )}
              </div>
            ))}
            {!loading && events.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                <Calendar size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Events Scheduled</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">Be the first to organize something great!</p>
              </div>
            )}
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
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event Title (e.g. Annual Meet 2026)"
                className="input-solid h-14"
                required
              />
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="w-full h-32 p-4 outline-none resize-none text-sm border border-border rounded-2xl focus:border-primary transition bg-muted/30"
                placeholder="Event description and details..."
              />
              <input
                type="text"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Venue / Meeting Link"
                className="input-solid h-14"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full h-14 bg-muted/30 border border-border rounded-xl px-4 text-xs font-black uppercase tracking-widest outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="networking">Networking</option>
                    <option value="webinar">Webinar</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <MoreHorizontal size={14} />
                  </div>
                  <div className="absolute -top-2 left-4 px-1 bg-card text-[8px] font-black text-primary uppercase tracking-widest">
                    Category
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full h-14 bg-muted/30 border border-border rounded-xl px-4 text-xs font-black uppercase tracking-widest outline-none focus:border-primary"
                  />
                  <div className="absolute -top-2 left-4 px-1 bg-card text-[8px] font-black text-primary uppercase tracking-widest">
                    Event Date
                  </div>
                </div>
              </div>

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
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Add Media
                  </p>
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
