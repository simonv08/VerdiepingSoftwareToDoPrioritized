# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar API v3 with Service Account authentication for your Todo app.

**Reference:** https://developers.google.com/workspace/calendar/api/v3/reference/calendars

## Overview

Your Cloud Functions now use **Service Account authentication** to manage Google Calendars. This allows your backend to create, read, update, and delete calendar events without requiring user OAuth tokens.

## Available Functions

1. **`createCalendar`** - Creates a new calendar
2. **`getCalendar`** - Gets calendar metadata
3. **`createCalendarEvent`** - Creates an event in a calendar
4. **`listCalendarEvents`** - Lists events from a calendar
5. **`updateCalendarEvent`** - Updates an event in a calendar
6. **`deleteCalendarEvent`** - Deletes an event from a calendar

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

### 2. Create a Service Account

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - **Service account name:** `firebase-todo-calendar`
   - **Description:** `Service account for Todo app calendar integration`
4. Click **Create and Continue**
5. Grant the service account Editor role (or create a custom role with calendar permissions)
6. Click **Create Key** and choose **JSON** format
7. Save the JSON file somewhere safe (you'll need it next)

### 3. Set Up Firebase Cloud Functions

#### Option A: Deploy with Environment Variables

1. In your service account JSON file, save the `project_id`
2. Add the service account JSON as a Firebase secret:

```bash
firebase functions:config:set gcp.service_account_json="$(cat /path/to/service-account-key.json)"
```

3. Update your `functions/src/index.ts` to use the service account JSON (already configured to use `GOOGLE_APPLICATION_CREDENTIALS`)

#### Option B: Use Google Application Credentials (Recommended)

1. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account JSON file
2. This is automatically handled by Firebase when you deploy

### 4. Share Calendars with Service Account

For the service account to access your calendars, you need to share them:

1. In Google Calendar, open **Settings** for the calendar you want to share
2. Go to **Share with specific people and groups**
3. Add the service account email (found in the JSON file as `client_email`)
4. Grant **Make changes to events** permission

### 5. Deploy Functions

```bash
npm install  # Install googleapis package
npm run build
firebase deploy --only functions
```

## Usage Examples

### Create a Calendar Event

```typescript
import { httpsCallable } from "firebase/functions";
import { getFirebase } from "./service/firebase";

const { functions } = getFirebase();
const createEventFn = httpsCallable(functions, "createCalendarEvent");

const result = await createEventFn({
  calendarId: "your-calendar-id@gmail.com",
  summary: "Team Meeting",
  description: "Weekly sync",
  location: "Conference Room A",
  startTime: "2024-06-15T10:00:00Z",
  endTime: "2024-06-15T11:00:00Z",
  attendees: ["colleague@gmail.com"],
});

console.log("Event created:", result.data.eventId);
```

### List Calendar Events

```typescript
const listEventsFn = httpsCallable(functions, "listCalendarEvents");

const result = await listEventsFn({
  calendarId: "your-calendar-id@gmail.com",
  timeMin: new Date().toISOString(),
  timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  maxResults: 10,
});

console.log("Events:", result.data.events);
```

### Update a Calendar Event

```typescript
const updateEventFn = httpsCallable(functions, "updateCalendarEvent");

await updateEventFn({
  calendarId: "your-calendar-id@gmail.com",
  eventId: "event-id-from-list",
  summary: "Updated Meeting Title",
});
```

### Delete a Calendar Event

```typescript
const deleteEventFn = httpsCallable(functions, "deleteCalendarEvent");

await deleteEventFn({
  calendarId: "your-calendar-id@gmail.com",
  eventId: "event-id-to-delete",
});
```

## Calendar ID Reference

- **Primary calendar:** `primary` or your email address (e.g., `user@gmail.com`)
- **Secondary calendar:** Calendar ID shown in calendar settings

## Error Handling

All functions throw `HttpsError` with one of these codes:

- `unauthenticated` - User not logged in
- `internal` - API call failed
- `invalid-argument` - Missing required parameters

Example error handling:

```typescript
try {
  const result = await createEventFn(eventData);
} catch (error: any) {
  console.error("Error:", error.message);
  // error.code will be one of the above
}
```

## Sync Tasks with Google Calendar

To sync your todos with Google Calendar:

1. When a task is created in Firebase:
   - Call `createCalendarEvent` with the task details
   - Store the returned `eventId` in Firestore alongside the task

2. When a task is updated:
   - Call `updateCalendarEvent` with the `eventId` stored in Firestore

3. When a task is deleted:
   - Call `deleteCalendarEvent` with the stored `eventId`

Example Firestore document structure:

```json
{
  "id": "task-123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "calendarEventId": "event-abc123",
  "dueDate": "2024-06-15",
  "createdAt": "2024-06-10"
}
```

## API Response Format

Based on Google Calendar API v3 reference:

### Calendar Resource

```json
{
  "kind": "calendar#calendar",
  "etag": "string",
  "id": "string",
  "summary": "string",
  "description": "string",
  "location": "string",
  "timeZone": "string",
  "conferenceProperties": {
    "allowedConferenceSolutionTypes": ["hangoutsMeet"]
  }
}
```

### Event Resource

```json
{
  "id": "string",
  "summary": "string",
  "description": "string",
  "location": "string",
  "start": {
    "dateTime": "2024-06-15T10:00:00Z"
  },
  "end": {
    "dateTime": "2024-06-15T11:00:00Z"
  }
}
```

## Troubleshooting

| Issue              | Solution                                          |
| ------------------ | ------------------------------------------------- |
| `401 Unauthorized` | Service account credentials not set up properly   |
| `403 Forbidden`    | Calendar not shared with service account email    |
| `404 Not Found`    | Calendar ID or Event ID doesn't exist             |
| `quota exceeded`   | You've exceeded your API quota (see limits below) |

## API Quotas

- **Calendars:** 1,000,000 requests per day
- **Events:** 500,000 create/update/delete per day
- Each calendar.insert = 4 quota units
- Each event operation = 1 quota unit

[View full quota documentation](https://developers.google.com/workspace/calendar/api/guides/quota)

## Next Steps

1. Complete setup steps 1-5 above
2. Add the Google Calendar integration to your React components
3. Create a service in `src/service/calendarService.ts` to wrap the Cloud Functions
4. Update your task/todo components to sync with Google Calendar
