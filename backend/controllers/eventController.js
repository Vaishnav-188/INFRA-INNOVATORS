import Event from '../models/Event.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .sort({ date: 1 });

        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current user's events
// @route   GET /api/events/my
// @access  Private
export const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('Error fetching my events:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Alumni and Admin only)
export const createEvent = async (req, res) => {
    try {
        const { title, description, eventType, date, venue, isVirtual, meetingLink } = req.body;

        const event = await Event.create({
            title,
            description,
            eventType,
            date,
            venue,
            isVirtual: isVirtual === 'true' || isVirtual === true,
            meetingLink,
            organizer: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully!',
            event
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update event status
// @route   PATCH /api/events/:id/status
// @access  Private (Admin only)
export const updateEventStatus = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        event.status = req.body.status || event.status;
        await event.save();

        res.json({
            success: true,
            message: 'Event status updated',
            event
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Update an event
// @route   PATCH /api/events/:id
// @access  Private (Owner or Admin only)
export const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Make sure user is event owner or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update this event' });
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Owner or Admin only)
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Make sure user is event owner or admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
