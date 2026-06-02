# Google Calendar Integration - Setup Summary

## What Was Implemented

Your Todo app now has **full Google Calendar integration** using the Google Calendar API v3 with **Service Account authentication**.

### Files Created/Modified

#### Backend (Cloud Functions)

- **Modified:** `functions/package.json` - Added `googleapis` package
- **Modified:** `functions/src/index.ts` - Complete Calendar API implementation with:
  - `createCalendar()` - Create new calendars
  - `getCalendar()` - Fetch calendar metadata
  - `createCalendarEvent()` - Create events
  - `listCalendarEvents()` - List events with filtering
  - `updateCalendarEvent()` - Update existing events
  - `deleteCalendarEvent()` - Delete events

#### Frontend (React)

- **Created:** `todo-app/src/service/calendarService.ts` - TypeScript service wrapping Cloud Functions
- **Created:** `todo-app/src/hooks/useCalendar.ts` - React hook for calendar operations
- **Created:** `todo-app/src/Components/CalendarEventsExample.tsx` - Example component

#### Documentation

- **Created:** `GOOGLE_CALENDAR_SETUP.md` - Complete setup guide
- **Created:** `CALENDAR_API_REFERENCE.md` - API reference from Google docs
- **Created:** `CALENDAR_SETUP_SUMMARY.md` - This file

## Next Steps

### 1. Set Up Service Account (Google Cloud Console)

```bash
# Steps:
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google Calendar API
4. Go to IAM & Admin > Service Accounts
5. Create service account named "firebase-todo-calendar"
6. Create JSON key and save it securely
```

### 2. Configure Firebase

```bash
# Set environment variable for service account
firebase functions:config:set gcp.service_account_json="$(cat /path/to/service-account-key.json)"

# Or set GOOGLE_APPLICATION_CREDENTIALS
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 3. Install Dependencies & Deploy

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 4. Share Calendars with Service Account

1. Open Google Calendar
2. Go to calendar settings
3. Add service account email as editor
4. Email found in service account JSON as `client_email`

### 5. Integrate Into Your Components

**Example 1: In your TaskList component**

```typescript
import { useCalendar } from '../hooks/useCalendar';
import { taskToCalendarEvent } from '../service/calendarService';

function TaskList() {
  const calendar = useCalendar({ calendarId: 'primary' });

  const handleTaskCreate = async (task) => {
    // Create in Firestore
    const firestoreTask = await createTask(task);

    // Sync to Google Calendar
    const event = taskToCalendarEvent(task);
    const { eventId } = await calendar.createEvent(
      event.summary,
      event.startTime,
      event.endTime,
      { description: event.description }
    );

    // Store eventId in Firestore for future updates
    await updateTask(firestoreTask.id, { calendarEventId: eventId });
  };

  return (/* your component */);
}
```

**Example 2: View upcoming calendar events**

```typescript
function Dashboard() {
  const calendar = useCalendar({ calendarId: 'primary' });

  useEffect(() => {
    calendar.fetchUpcomingEvents(7); // Next 7 days
  }, []);

  return (
    <div>
      {calendar.events.map(event => (
        <div key={event.id}>
          <h3>{event.summary}</h3>
          <p>{new Date(event.start.dateTime).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### 6. Sync Strategy

Store `calendarEventId` in your Firestore task documents:

```json
{
  "id": "task-123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2024-06-15",
  "completed": false,
  "calendarEventId": "event-abc123",
  "createdAt": "2024-06-10T10:00:00Z"
}
```

Then on updates/deletes, use the stored `calendarEventId`:

```typescript
// Update task
await calendar.updateEvent(task.calendarEventId, {
  summary: updatedTitle,
  description: updatedDescription,
});

// Delete task
await calendar.deleteEvent(task.calendarEventId);
```

## API Reference

All functions follow Google Calendar API v3:
https://developers.google.com/workspace/calendar/api/v3/reference/calendars

### Response Format Example

```json
{
  "id": "event-123",
  "summary": "Team Meeting",
  "description": "Weekly sync",
  "start": {
    "dateTime": "2024-06-15T10:00:00Z"
  },
  "end": {
    "dateTime": "2024-06-15T11:00:00Z"
  }
}
```

## Troubleshooting

| Problem                               | Solution                                               |
| ------------------------------------- | ------------------------------------------------------ |
| 401 Unauthorized                      | Check GOOGLE_APPLICATION_CREDENTIALS is set            |
| 403 Forbidden                         | Calendar not shared with service account email         |
| Service account can't access calendar | Ensure service account has Editor role for calendar    |
| Events not appearing                  | Verify calendarId format (use `primary` or full email) |

## Quotas

- **Read:** 1,000,000 requests/day
- **Write:** 500,000 requests/day

See [Quotas Documentation](https://developers.google.com/workspace/calendar/api/guides/quota)

## Files to Edit Next

1. **Update Task Form** - Add calendar sync when creating tasks
2. **Update Task List** - Show calendar event status
3. **Update Task Deletion** - Delete corresponding calendar event
4. **Dashboard** - Display upcoming calendar events

## Example Component

Already created: `src/Components/CalendarEventsExample.tsx`

Use as reference for your implementation.

## Resources

- 📚 [Setup Guide](./GOOGLE_CALENDAR_SETUP.md)
- 📖 [API Reference](./CALENDAR_API_REFERENCE.md)
- 🔗 [Official Google Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/calendars)
- 📁 Service file: `src/service/calendarService.ts`
- 🎣 Hook file: `src/hooks/useCalendar.ts`
