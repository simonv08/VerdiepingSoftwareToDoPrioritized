import { useState } from 'react';
import {
  createCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
  type CalendarEvent,
} from '../service/calendarService';

interface UseCalendarOptions {
  calendarId?: string;
}

/**
 * Hook for managing Google Calendar operations
 * Usage: const calendar = useCalendar({ calendarId: 'your-calendar-id' });
 */
export function useCalendar(options?: UseCalendarOptions) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarId = options?.calendarId || 'primary';

  const createEvent = async (
    summary: string,
    startTime: string,
    endTime: string,
    description?: string,
    location?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createCalendarEvent(calendarId, summary, startTime, endTime, {
        description,
        location,
      });
      // Refresh events after creation
      await fetchUpcomingEvents();
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create event';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (timeMin?: string, timeMax?: string, maxResults: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCalendarEvents(calendarId, {
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });
      setEvents(result.events);
      return result.events;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch events';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async (daysInFuture: number = 30) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUpcomingEvents(calendarId, daysInFuture);
      setEvents(result.events);
      return result.events;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch upcoming events';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateCalendarEvent(calendarId, eventId, updates);
      // Refresh events after update
      await fetchUpcomingEvents();
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update event';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteCalendarEvent(calendarId, eventId);
      // Refresh events after deletion
      await fetchUpcomingEvents();
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete event';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    events,
    loading,
    error,
    createEvent,
    fetchEvents,
    fetchUpcomingEvents,
    updateEvent,
    deleteEvent,
    clearError,
  };
}
