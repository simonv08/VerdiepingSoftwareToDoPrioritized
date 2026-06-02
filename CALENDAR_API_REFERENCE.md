# Google Calendar API v3 - Quick Reference

**Official Reference:** https://developers.google.com/workspace/calendar/api/v3/reference/calendars

## Calendar Resource

### Properties

| Property                | Type    | Description                                    |
| ----------------------- | ------- | ---------------------------------------------- |
| `kind`                  | string  | Type of resource (`calendar#calendar`)         |
| `etag`                  | string  | ETag of the resource                           |
| `id`                    | string  | Calendar ID (e.g., `user@gmail.com`)           |
| `summary`               | string  | Calendar title                                 |
| `description`           | string  | Calendar description                           |
| `location`              | string  | Geographic location                            |
| `timeZone`              | string  | Time zone (IANA format, e.g., `Europe/Zurich`) |
| `dataOwner`             | string  | Email of calendar owner (read-only)            |
| `conferenceProperties`  | object  | Conference settings                            |
| `autoAcceptInvitations` | boolean | Auto-accept invitations                        |

### Example Resource

```json
{
  "kind": "calendar#calendar",
  "etag": "\"123456\"",
  "id": "user@gmail.com",
  "summary": "My Calendar",
  "description": "This is my personal calendar",
  "location": "New York, USA",
  "timeZone": "America/New_York",
  "conferenceProperties": {
    "allowedConferenceSolutionTypes": ["hangoutsMeet", "eventHangout"]
  }
}
```

## Calendar Methods

### Insert (Create)

```typescript
POST /calendars
{
  "summary": "Project X",
  "description": "Calendar for Project X",
  "timeZone": "America/Los_Angeles"
}
```

**Response:** Calendar resource with new `id`

### Get

```typescript
GET / calendars / { calendarId };
```

**Response:** Calendar resource

### Update

```typescript
PUT /calendars/{calendarId}
{
  "summary": "Updated Title",
  "description": "Updated description"
}
```

**Response:** Updated calendar resource

### Patch (Partial Update)

```typescript
PATCH /calendars/{calendarId}
{
  "summary": "New Title"
}
```

**Response:** Updated calendar resource

### Delete

```typescript
DELETE / calendars / { calendarId };
```

**Response:** Empty response

### Clear

```typescript
POST / calendars / { calendarId } / clear;
```

**Response:** Empty response (deletes all events)

## Event Resource

### Properties

| Property      | Type   | Description                           |
| ------------- | ------ | ------------------------------------- |
| `id`          | string | Event ID                              |
| `summary`     | string | Event title                           |
| `description` | string | Event description                     |
| `location`    | string | Event location                        |
| `start`       | object | Start time (`dateTime` or `date`)     |
| `end`         | object | End time (`dateTime` or `date`)       |
| `attendees`   | array  | List of attendees                     |
| `status`      | string | `confirmed`, `tentative`, `cancelled` |
| `created`     | string | Creation time (ISO 8601)              |
| `updated`     | string | Last update time (ISO 8601)           |

### Example Event

```json
{
  "id": "event123",
  "summary": "Team Meeting",
  "description": "Weekly sync",
  "location": "Conference Room A",
  "start": {
    "dateTime": "2024-06-15T10:00:00Z"
  },
  "end": {
    "dateTime": "2024-06-15T11:00:00Z"
  },
  "attendees": [
    {
      "email": "colleague@example.com"
    }
  ],
  "status": "confirmed"
}
```

## Time Formats

### DateTime (with timezone)

```
2024-06-15T10:00:00Z       // UTC
2024-06-15T10:00:00-07:00  // Pacific Time
2024-06-15T10:00:00+02:00  // Central European Time
```

### Date (all-day events)

```
2024-06-15
```

## Calendar IDs

- **Primary calendar:** `primary` or user email `user@gmail.com`
- **Secondary calendars:** Calendar-specific IDs (found in settings)

## Common Queries

### List Events in Date Range

```typescript
GET /calendars/{calendarId}/events?
  timeMin=2024-06-01T00:00:00Z&
  timeMax=2024-06-30T23:59:59Z&
  singleEvents=true&
  orderBy=startTime&
  maxResults=50
```

### List All-Day Events

```typescript
GET /calendars/{calendarId}/events?
  showDeleted=false&
  maxResults=50
```

### Sync Events (Incremental)

```typescript
GET /calendars/{calendarId}/events?
  syncToken=CjUCCjwK...  // from previous response
```

## Error Codes

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 200  | OK                                 |
| 400  | Bad Request                        |
| 401  | Unauthorized (invalid credentials) |
| 403  | Forbidden (no permission)          |
| 404  | Not Found                          |
| 409  | Conflict                           |
| 410  | Gone (deleted)                     |
| 500  | Internal Server Error              |
| 503  | Service Unavailable                |

## API Quotas

- **Read operations:** 1,000,000 requests/day
- **Write operations:** 500,000 requests/day
- **insert (Calendar):** 4 quota units
- **insert (Event):** 1 quota unit
- **update/patch/delete:** 1 quota unit each

## Usage in Your App

### Create Event from Task

```typescript
const task = {
  title: "Buy groceries",
  dueDate: "2024-06-15",
  description: "Milk, eggs, bread",
};

await createCalendarEvent(
  "primary",
  task.title,
  "2024-06-15T09:00:00Z",
  "2024-06-15T10:00:00Z",
  { description: task.description },
);
```

### List Today's Events

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

await listCalendarEvents("primary", {
  timeMin: today.toISOString(),
  timeMax: tomorrow.toISOString(),
  orderBy: "startTime",
});
```

### Update Event Time

```typescript
await updateCalendarEvent("primary", eventId, {
  startTime: "2024-06-15T14:00:00Z",
  endTime: "2024-06-15T15:00:00Z",
});
```

## Links

- [Full API Reference](https://developers.google.com/workspace/calendar/api/v3/reference)
- [Calendar Events Reference](https://developers.google.com/workspace/calendar/api/v3/reference/events)
- [Quotas & Limits](https://developers.google.com/workspace/calendar/api/guides/quota)
- [Authentication Guide](https://developers.google.com/workspace/calendar/api/guides/auth)
