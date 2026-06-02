import { useEffect, useState, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { httpsCallable } from 'firebase/functions';
import { getFirebase } from '../service/firebase';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

interface CalendarEventsProps {
  daysInFuture?: number;
  maxResults?: number;
}

interface StoredCalendarData {
  events: CalendarEvent[];
  timestamp: number;
  token: string;
}

export const CalendarEvents: React.FC<CalendarEventsProps> = ({
  daysInFuture = 30,
  maxResults = 10,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('googleCalendarToken')
  );
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      localStorage.setItem('googleCalendarToken', codeResponse.access_token);
      lastFetchRef.current = 0; // Reset to fetch immediately
    },
    onError: () => {
      setError('Failed to login with Google');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    flow: 'implicit',
  });

  const fetchCalendarEvents = async (token: string) => {
    // Prevent excessive fetching - only fetch if last fetch was more than 5 minutes ago
    const now = Date.now();
    if (now - lastFetchRef.current < 5 * 60 * 1000) {
      console.log('Skipping fetch - last fetch was recent');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Firebase Cloud Function to fetch calendar events
      const { functions } = getFirebase();
      const getCalendarEventsFunction = httpsCallable(functions, 'getCalendarEvents');

      const result = await getCalendarEventsFunction({
        accessToken: token,
        daysInFuture,
        maxResults,
      });

      const allEvents: CalendarEvent[] = (result.data as any).events || [];

      // Sort all events by start time
      allEvents.sort((a, b) => {
        const aTime = new Date(a.start.dateTime || a.start.date || 0).getTime();
        const bTime = new Date(b.start.dateTime || b.start.date || 0).getTime();
        return aTime - bTime;
      });

      setEvents(allEvents.slice(0, maxResults));
      lastFetchRef.current = now;

      // Cache the data
      const cacheData: StoredCalendarData = {
        events: allEvents.slice(0, maxResults),
        timestamp: now,
        token: token.substring(0, 10),
      };
      localStorage.setItem('googleCalendarCache', JSON.stringify(cacheData));
    } catch (err: any) {
      if (err.code === 'unauthenticated') {
        // Token expired
        localStorage.removeItem('googleCalendarToken');
        setAccessToken(null);
        setError('Session expired. Please reconnect your Google Calendar.');
      } else {
        setError(err.message || 'Failed to fetch calendar events');
      }
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load cached events on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('googleCalendarCache');
      if (cached) {
        const data: StoredCalendarData = JSON.parse(cached);
        setEvents(data.events);
        lastFetchRef.current = data.timestamp;
      }
    } catch (err) {
      console.error('Failed to load cached events:', err);
    }
  }, []);

  // Fetch events only when token changes
  useEffect(() => {
    if (!accessToken) return;

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetch by 500ms to prevent rapid refetches
    fetchTimeoutRef.current = setTimeout(() => {
      void fetchCalendarEvents(accessToken);
    }, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [accessToken]); // Only depend on accessToken

  const handleManualRefresh = async () => {
    if (accessToken) {
      lastFetchRef.current = 0; // Force refresh
      await fetchCalendarEvents(accessToken);
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const start = event.start.dateTime || event.start.date;
    if (!start) return 'No time';

    const date = new Date(start);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: event.start.dateTime ? '2-digit' : undefined,
      minute: event.start.dateTime ? '2-digit' : undefined,
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50/10 to-slate-100/10 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
        <p className="text-xs text-slate-400">
          Next {daysInFuture} days
        </p>
      </div>

      {!accessToken ? (
        <div className="text-center py-6">
          <button
            onClick={() => login()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Connect Google Calendar
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Connect to view your calendar
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="px-3 py-1 bg-slate-600/50 hover:bg-slate-600 text-white rounded text-xs disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                setAccessToken(null);
                localStorage.removeItem('googleCalendarToken');
                setEvents([]);
              }}
              className="px-3 py-1 bg-red-500/50 hover:bg-red-500 text-white rounded text-xs transition-colors"
            >
              Disconnect
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-xs">
              {error}
            </div>
          )}

          {events.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-2 bg-slate-700/30 rounded border-l-2 border-blue-400 hover:bg-slate-700/50 transition-colors"
                >
                  <h4 className="font-medium text-sm text-white truncate">{event.summary}</h4>
                  <p className="text-xs text-slate-300">
                    {formatEventTime(event)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-slate-400 truncate">📍 {event.location}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400 text-sm">
              <p>No events scheduled</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarEvents;
