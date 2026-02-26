# ToDoPriorities (Verdieping Software)

Lokale to-do app (React + Vite + Tailwind) met:

- Deadlines: `daysUntilDue`, `overdue`, `overdueDays`
- Status classificatie: Open / Due soon / Overdue / Completed
- Auto-repeat bij afronden (daily/weekly/monthly/custom)
- Dynamische prioriteit + automatische sortering
- Firebase (Firestore) persistence + async state (loading/error/retry)

## Run

Vanuit repo-root:

```bash
npm run dev
npm run build
```

## Firebase (cross-device sync)

Deze app gebruikt Firebase (Auth + Firestore). Je data staat per gebruiker in Firestore, en je moet inloggen om taken/boodschappen te zien of te wijzigen.

1. Maak een Firebase project
2. Voeg een **Web App** toe (Project settings → Your apps → Web app)
3. Zet **Authentication** aan → Sign-in method → **Google** (aanrader voor cross-device)
4. Authentication → Settings → Authorized domains → voeg `localhost` toe (voor development)
5. Zet **Cloud Firestore** aan
6. Maak een `todo-app/.env` op basis van `.env.example` en vul je Firebase config in

Voorbeeld rules (iets strakker):

```txt
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		function isOwner(userId) {
			return request.auth != null && request.auth.uid == userId;
		}

		match /users/{userId}/tasks/{taskId} {
			allow read: if isOwner(userId);
			allow create: if isOwner(userId)
				&& request.resource.data.id == taskId;
			allow update: if isOwner(userId)
				&& request.resource.data.id == taskId
				&& request.resource.data.createdAt == resource.data.createdAt;
			allow delete: if isOwner(userId);
		}

		match /users/{userId}/groceries/{itemId} {
			allow read: if isOwner(userId);
			allow create: if isOwner(userId)
				&& request.resource.data.id == itemId;
			allow update: if isOwner(userId)
				&& request.resource.data.id == itemId
				&& request.resource.data.createdAt == resource.data.createdAt;
			allow delete: if isOwner(userId);
		}

		match /users/{userId}/groceryHistory/{historyId} {
			allow read, write: if isOwner(userId);
		}
	}
}
```

Of direct in deze folder:

```bash
npm install
npm run dev
```

## Architectuur

- UI components: `src/Components/*`
- Business logic (mutaties/selectors): `src/Features/tasks/*`
- Persistence service: `src/service/tasksService.ts`
- Async state hook: `src/hooks/useTasks.ts`

## Prioriteit

Het algoritme staat in `src/Features/tasks/priority.ts` en gebruikt:

- repeat interval
- daysUntilDue
- overdueDays
- overdueCount

Output: `priorityScore: number` (hoger = urgenter).

## Database & Sync (fase 6)

Momenteel: Firebase (Auth + Firestore) voor cross-device sync.
