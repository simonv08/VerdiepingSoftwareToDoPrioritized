import { httpsCallable } from 'firebase/functions';
import { getFirebase } from './firebase';

const { functions } = getFirebase();

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

/**
 * Create a new calendar
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert
 */
export async function createCalendar(
  summary: string,
  description?: string,
  timeZone?: string
) {
  const createCalendarFn = httpsCallable(functions, 'createCalendar');
  const result = await createCalendarFn({
    summary,
    description,
    timeZone,
  });
  return result.data;
}

/**
 * Get calendar metadata
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/calendars/get
 */
export async function getCalendar(calendarId: string) {
  const getCalendarFn = httpsCallable(functions, 'getCalendar');
  const result = await getCalendarFn({ calendarId });
  return result.data;
}

/**
 * Create an event in a calendar
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 */
export async function createCalendarEvent(
  calendarId: string,
  summary: string,
  startTime: string, // ISO 8601 format
  endTime: string, // ISO 8601 format
  options?: {
    description?: string;
    location?: string;
    attendees?: string[];
  }
) {
  const createEventFn = httpsCallable(functions, 'createCalendarEvent');
  const result = await createEventFn({
    calendarId,
    summary,
    startTime,
    endTime,
    description: options?.description,
    location: options?.location,
    attendees: options?.attendees,
  });
  return result.data;
}

/**
 * List events from a calendar
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/list
 */
export async function listCalendarEvents(
  calendarId: string,
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
  }
) {
  const listEventsFn = httpsCallable(functions, 'listCalendarEvents');
  const result = await listEventsFn({
    calendarId,
    timeMin: options?.timeMin,
    timeMax: options?.timeMax,
    maxResults: options?.maxResults,
    singleEvents: options?.singleEvents,
    orderBy: options?.orderBy,
  });
  return result.data as { events: CalendarEvent[] };
}

/**
 * Update an event in a calendar
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/update
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  const updateEventFn = httpsCallable(functions, 'updateCalendarEvent');
  const result = await updateEventFn({
    calendarId,
    eventId,
    ...updates,
  });
  return result.data;
}

/**
 * Delete an event from a calendar
 * Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/delete
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  const deleteEventFn = httpsCallable(functions, 'deleteCalendarEvent');
  const result = await deleteEventFn({
    calendarId,
    eventId,
  });
  return result.data;
}

/**
 * Helper: Convert a task to a calendar event
 * Useful for syncing tasks with calendar
 */
export function taskToCalendarEvent(task: {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
}) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
  const startTime = dueDate.toISOString();
  const endTime = new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour duration

  return {
    summary: task.title,
    description: task.description,
    startTime,
    endTime,
  };
}

/**
 * Helper: Format date for Google Calendar API
 * Converts local date to ISO 8601 format
 */
export function formatDateForCalendar(date: Date): string {
  return date.toISOString();
}

/**
 * Helper: Get next 30 days of events
 */
export async function getUpcomingEvents(calendarId: string, daysInFuture: number = 30) {
  const now = new Date();
  const future = new Date(now.getTime() + daysInFuture * 24 * 60 * 60 * 1000);

  return listCalendarEvents(calendarId, {
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });
}
