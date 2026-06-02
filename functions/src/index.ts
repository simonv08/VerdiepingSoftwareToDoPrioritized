import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

// Initialize the calendar API with service account credentials
const calendar = google.calendar('v3');

// Get authentication client (uses GOOGLE_APPLICATION_CREDENTIALS environment variable)
function getAuthClient() {
  return new Promise((resolve, reject) => {
    google.auth.getClient().then(resolve).catch(reject);
  });
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

/**
 * Create a new calendar for a user
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert
 */
export const createCalendar = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      summary: string;
      description?: string;
      timeZone?: string;
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const { summary, description, timeZone = 'UTC' } = request.data;

      const response = await calendar.calendars.insert({
        auth,
        requestBody: {
          summary,
          description,
          timeZone,
        },
      });

      functions.logger.info('Calendar created', { calendarId: response.data.id });

      return {
        success: true,
        calendarId: response.data.id,
        calendar: response.data,
      };
    } catch (error: any) {
      functions.logger.error('Calendar creation error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to create calendar');
    }
  }
);

/**
 * Get calendar metadata
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/calendars/get
 */
export const getCalendar = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      calendarId: string;
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const { calendarId } = request.data;

      const response = await calendar.calendars.get({
        auth,
        calendarId,
      });

      return response.data;
    } catch (error: any) {
      functions.logger.error('Get calendar error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to get calendar');
    }
  }
);

/**
 * Create an event in the calendar
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 */
export const createCalendarEvent = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      calendarId: string;
      summary: string;
      description?: string;
      location?: string;
      startTime: string; // ISO 8601 format
      endTime: string; // ISO 8601 format
      attendees?: string[];
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const { calendarId, summary, description, location, startTime, endTime, attendees } =
        request.data;

      const response = await calendar.events.insert({
        auth,
        calendarId,
        requestBody: {
          summary,
          description,
          location,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          attendees: attendees?.map((email) => ({ email })),
        },
      });

      functions.logger.info('Event created', { eventId: response.data.id, calendarId });

      return {
        success: true,
        eventId: response.data.id,
        event: response.data,
      };
    } catch (error: any) {
      functions.logger.error('Event creation error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to create event');
    }
  }
);

/**
 * List events from a calendar
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/events/list
 */
export const listCalendarEvents = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      calendarId: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const {
        calendarId,
        timeMin,
        timeMax,
        maxResults = 10,
        singleEvents = true,
        orderBy = 'startTime',
      } = request.data;

      const response = await calendar.events.list({
        auth,
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy: orderBy === 'startTime' ? 'startTime' : 'updated',
      });

      const events: CalendarEvent[] = (response.data.items || []).map((event: any) => ({
        id: event.id || '',
        summary: event.summary || 'Untitled',
        start: event.start || { date: '' },
        end: event.end || { date: '' },
        description: event.description,
        location: event.location,
      }));

      functions.logger.info('Events listed', { count: events.length, calendarId });

      return { events };
    } catch (error: any) {
      functions.logger.error('List events error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to list events');
    }
  }
);

/**
 * Update an event in the calendar
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/events/update
 */
export const updateCalendarEvent = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      calendarId: string;
      eventId: string;
      summary?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const { calendarId, eventId, summary, description, location, startTime, endTime } =
        request.data;

      const updateData: any = {};
      if (summary) updateData.summary = summary;
      if (description) updateData.description = description;
      if (location) updateData.location = location;
      if (startTime) updateData.start = { dateTime: startTime };
      if (endTime) updateData.end = { dateTime: endTime };

      const response = await calendar.events.update({
        auth,
        calendarId,
        eventId,
        requestBody: updateData,
      });

      functions.logger.info('Event updated', { eventId, calendarId });

      return {
        success: true,
        event: response.data,
      };
    } catch (error: any) {
      functions.logger.error('Update event error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to update event');
    }
  }
);

/**
 * Delete an event from the calendar
 * Based on: https://developers.google.com/workspace/calendar/api/v3/reference/events/delete
 */
export const deleteCalendarEvent = functions.https.onCall(
  async (
    request: functions.https.CallableRequest<{
      calendarId: string;
      eventId: string;
    }>
  ) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const auth = await getAuthClient();
      const { calendarId, eventId } = request.data;

      await calendar.events.delete({
        auth,
        calendarId,
        eventId,
      });

      functions.logger.info('Event deleted', { eventId, calendarId });

      return { success: true };
    } catch (error: any) {
      functions.logger.error('Delete event error', { error: error.message });
      throw new functions.https.HttpsError('internal', error.message || 'Failed to delete event');
    }
  }
);
