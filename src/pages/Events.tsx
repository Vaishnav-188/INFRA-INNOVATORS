import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import GlassCard from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { usePageTransition } from '@/hooks/useGSAP';
import { MoreHorizontal, Edit3, Bookmark, Trash2, Image, X, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

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
      const response = await fetch('/api/events');
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

  const canPost = user?.role === 'admin' || user?.role === 'alumni';

  const handleAddPost = async () => {
    if (!newPostText.trim() || !eventTitle.trim()) {
      toast.error('Please enter event title and details');
      return;
    }

    const token = localStorage.getItem('alumni_hub_token');
    const tid = toast.loading(isEditing ? 'Updating event...' : 'Posting new event...');

    try {
      const response = await fetch(`/api/events${isEditing ? `/${editPostId}` : ''}`, {
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
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;

    // Optimistic Update
    const previousEvents = [...events];
    setEvents(events.filter(e => e._id !== id));
    setOpenDropdown(null);

    const token = localStorage.getItem('alumni_hub_token');
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Event deleted');
      } else {
        // Rollback on failure
        setEvents(previousEvents);
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      setEvents(previousEvents);
      toast.error('Connection error');
    }
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
      <div className="pt-40 pb-20 px-4 flex flex-col items-center">
        <div ref={pageRef} className="feed-container w-full">
          {/* Post Creator */}
          {canPost && (
            <div className="glass-card rounded-[2.5rem] p-8 mb-10 border border-primary/10 shadow-xl shadow-primary/5 hover:border-primary/30 transition-all">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg shadow-primary/30">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Host an Event</h2>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Spread the word about workshops, meetups, or webinars</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-8 py-4 bg-muted hover:bg-primary hover:text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border shadow-sm"
                >
                  START POSTING...
                </button>
              </div>
            </div>
          )}

          {/* Events Feed */}
          <div className="space-y-8">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Gathering Events...</p>
              </div>
            ) : events.map((event) => (
              <div key={event._id} className="glass-card rounded-[3rem] border border-border relative overflow-hidden hover:border-primary/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/5">
                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-2xl text-primary shadow-inner uppercase tracking-widest">
                        {event.organizer?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-foreground uppercase tracking-tight">{event.organizer?.name || 'Anonymous'}</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                          POSTED: {new Date(event.createdAt).toLocaleDateString()}
                          {event.date && (
                            <span className="text-primary bg-primary/10 px-3 py-0.5 rounded-full ml-2">
                              EVENT DATE: {new Date(event.date).toLocaleDateString()}
                            </span>
                          )}
                          {event.status === 'pending' && (
                            <span className="text-warning bg-warning/10 px-3 py-0.5 rounded-full ml-2 border border-warning/20">
                              WAITING FOR APPROVAL
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === event._id ? null : event._id)}
                        className="p-3 hover:bg-muted rounded-2xl transition-colors"
                      >
                        <MoreHorizontal size={24} className="text-muted-foreground" />
                      </button>

                      {openDropdown === event._id && (
                        <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-3 animate-fade-in ring-1 ring-black/5">
                          {(user?.role === 'admin' || (user?.role === 'alumni' && event.organizer?._id === user?.id)) && (
                            <button
                              onClick={() => handleEdit(event)}
                              className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-3 transition"
                            >
                              <Edit3 size={16} /> EDIT EVENT
                            </button>
                          )}
                          {(user?.role === 'admin' || (user?.role === 'alumni' && event.organizer?._id === user?.id)) && (
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 flex items-center gap-3 transition"
                            >
                              <Trash2 size={16} /> DELETE EVENT
                            </button>
                          )}
                          <button className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted flex items-center gap-3 transition">
                            <Bookmark size={16} /> SAVE EVENT
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-3xl font-black text-foreground mb-4 tracking-tighter leading-tight">{event.title}</h4>
                    <p className="text-base text-foreground/70 leading-relaxed font-medium">{event.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="px-5 py-2 bg-primary/10 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-primary/10 flex items-center gap-2">
                      <Calendar size={14} /> {event.eventType || 'Networking'}
                    </div>
                    {event.venue && (
                      <div className="px-5 py-2 bg-muted rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border flex items-center gap-2">
                        <MapPin size={14} /> {event.venue}
                      </div>
                    )}
                  </div>
                </div>

                {event.imageUrl && (
                  <div className="border-t border-border bg-muted/30">
                    <img
                      src={event.imageUrl}
                      alt="Event Banner"
                      className="w-full h-auto max-h-[600px] object-cover hover:scale-[1.01] transition-transform duration-700"
                    />
                  </div>
                )}
              </div>
            ))}

            {!loading && events.length === 0 && (
              <div className="text-center py-32 bg-muted/10 rounded-[3rem] border border-dashed border-border">
                <Calendar size={64} className="mx-auto mb-6 text-primary opacity-20" />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">The list is empty</h3>
                <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">No events have been posted recently.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-24 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-scale-in my-auto relative z-50">
            <div className="p-10 md:p-14 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase">
                  {isEditing ? 'MODIFY EVENT' : 'CREATE EVENT'}
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">
                  Design an immersive experience for the hub
                </p>
              </div>
              <button
                onClick={resetModal}
                className="w-14 h-14 flex items-center justify-center hover:bg-muted rounded-full transition-all border border-border shadow-sm active:scale-95"
              >
                <X size={24} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-10 md:p-14 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
                  <label className="text-[10px] font-black text-primary uppercase mb-3 block tracking-[0.2em]">Post Title / Event Name</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter a catchy title..."
                    className="w-full bg-background border-2 border-border focus:border-primary rounded-2xl h-16 px-6 font-black text-lg outline-none transition-all placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-3 tracking-widest">Description</label>
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    className="w-full h-44 p-6 outline-none resize-none text-base border border-border rounded-3xl focus:border-primary transition bg-muted/20 font-medium leading-relaxed"
                    placeholder="Provide a detailed roadmap of the event activities, speakers, and goals..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-3 tracking-widest">Venue / Link</label>
                    <input
                      type="text"
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="Auditorium or G-Meet Link"
                      className="input-solid h-16 px-6 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-3 tracking-widest">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-16 bg-muted/20 border border-border rounded-2xl px-6 text-sm font-black uppercase tracking-widest outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-3 tracking-widest">Select Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['networking', 'webinar', 'workshop', 'conference', 'social', 'other'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEventType(cat)}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${eventType === cat
                          ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]'
                          : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {newPostImage && (
                  <div className="relative group rounded-[2.5rem] overflow-hidden border border-border shadow-2xl">
                    <img
                      src={newPostImage}
                      alt="Banner Preview"
                      className="w-full h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        onClick={() => setNewPostImage('')}
                        className="bg-destructive text-destructive-foreground rounded-full p-4 shadow-2xl transform scale-75 group-hover:scale-100 transition-transform"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 md:p-14 bg-muted/10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex gap-6 items-center">
                <label className="cursor-pointer group">
                  <div className="w-16 h-16 flex items-center justify-center bg-card border border-border rounded-3xl group-hover:border-primary transition-all text-muted-foreground group-hover:text-primary shadow-sm">
                    <Image size={32} />
                  </div>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
                <div>
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Add a Cover Photo</p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tight mt-1">High-quality JPG/PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={resetModal}
                  className="flex-1 md:flex-none px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleAddPost}
                  className="flex-[2] md:flex-none bg-primary text-primary-foreground px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isEditing ? 'COMMIT UPDATES' : 'LAUNCH EVENT'}
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
