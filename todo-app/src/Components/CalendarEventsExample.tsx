import { useState } from 'react';
import { useCalendar } from '../hooks/useCalendar';

/**
 * Example component showing how to use Google Calendar integration
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/calendars
 */
export function CalendarEventsExample() {
  const calendar = useCalendar({ calendarId: 'primary' });
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('');

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventTime) {
      alert('Please fill in title and time');
      return;
    }

    try {
      const startTime = new Date(eventTime).toISOString();
      const endTime = new Date(new Date(eventTime).getTime() + 60 * 60 * 1000).toISOString();

      await calendar.createEvent(
        eventTitle,
        startTime,
        endTime,
        eventDescription
      );

      // Clear form
      setEventTitle('');
      setEventDescription('');
      setEventTime('');
      alert('Event created successfully!');
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleFetchEvents = async () => {
    try {
      await calendar.fetchUpcomingEvents(30);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch events');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendar.deleteEvent(eventId);
      alert('Event deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Google Calendar Events</h2>

      {/* Error Display */}
      {calendar.error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {calendar.error}
          <button
            onClick={calendar.clearError}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Event Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            disabled={calendar.loading}
          />
          <textarea
            placeholder="Event Description (optional)"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={3}
            disabled={calendar.loading}
          />
          <input
            type="datetime-local"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            disabled={calendar.loading}
          />
          <button
            onClick={handleCreateEvent}
            disabled={calendar.loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {calendar.loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>

      {/* Fetch Events */}
      <div className="mb-6">
        <button
          onClick={handleFetchEvents}
          disabled={calendar.loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {calendar.loading ? 'Loading...' : 'Load Upcoming Events'}
        </button>
      </div>

      {/* Events List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Events ({calendar.events.length})
        </h3>
        {calendar.events.length === 0 ? (
          <p className="text-gray-500">No events found</p>
        ) : (
          <div className="space-y-3">
            {calendar.events.map((event) => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{event.summary}</h4>
                    {event.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {event.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      <p>
                        Start:{' '}
                        {event.start.dateTime
                          ? new Date(event.start.dateTime).toLocaleString()
                          : event.start.date}
                      </p>
                      <p>
                        End:{' '}
                        {event.end.dateTime
                          ? new Date(event.end.dateTime).toLocaleString()
                          : event.end.date}
                      </p>
                    </div>
                    {event.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        Location: {event.location}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={calendar.loading}
                    className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
