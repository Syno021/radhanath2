### BBT Africa Connect — Support & User Guide

This guide explains what the BBT Africa Connect app does and how to use its core components. It’s intended for users, facilitators, and admins supporting the app.

---

## Quick guide for everyone (non‑technical)

Use this app to explore sacred books, find local regions and temples, and join community groups and reading clubs. Here’s all you really need:

- **What you can do**
  - Read about books and save your favorites
  - Find nearby regions and temples
  - Join WhatsApp groups and reading clubs
  - Update your profile (name and photo)

- **How to get around**
  - From the first screen, tap **Login**. New here? Tap **Register**.
  - After you log in, tap **Explore** to browse everything.
  - Tap a card (Books, Regions, WhatsApp Groups, Reading Clubs, Temples) to go in.
  - Tap **Profile** to change your name or photo.

- **First steps**
  1) Register or log in with your email and password.
  2) Go to **Explore** and choose what interests you.
  3) Save books you like, or join a group/club if you want to participate.

- **Common actions**
  - Forgot your password? On the Login screen, tap **Forgot Password** and follow the email you receive.
  - Want to change your name or photo? Go to **Profile** and update it.
  - Want to join a group or club? Open it from **Explore** and look for the join/open option.

- **If you get stuck**
  - Make sure you have internet access.
  - Try closing and reopening the app.
  - If your login isn’t working, reset your password from the Login screen.
  - If you still need help, contact support and tell them what you tried and what error you saw.

- **Optional: What it’s built with**
  - React Native and Expo (mobile app platform) and Firebase (for login and data). You don’t need to know this to use the app.

---

## Overview

BBT Africa Connect helps devotees explore Srila Prabhupada’s books, discover ISKCON regions and temples, join WhatsApp groups and reading clubs, and manage activities via an admin console. The app is built with Expo/React Native and uses Firebase for authentication and data storage.

- **Platforms**: Android, iOS, Web (via Expo)
- **Tech stack**: React Native, Expo, React Navigation, Firebase
- **Data**: Users, Books, Regions, Temples, WhatsApp Groups, Reading Clubs, Book Reports

---

## Roles & Access

- **Visitor/User**: Browse Explore, view Books, Regions, Groups, Clubs, Temples. Manage Profile.
- **Admin**: All user capabilities + access Admin Dashboard and Management to add/manage content (books, groups, regions, clubs, temples).
- **Facilitator**: A user role used by reading clubs; limited admin-like actions for clubs (configured per Firestore rules/implementation).

Role selection is determined after login by reading the user’s Firestore `role` field. See `screens/Login.tsx` for routing logic to `UserTabs` vs `AdminTabs`.

---

## Navigation

- Root stack: `app/navigation/AppNavigator.tsx`
  - `Home` (landing/marketing)
  - `Login`, `Register`, `ForgotPassword`
  - `UserTabs` (user experience)
  - `AdminTabs` (admin console)
  - `About`

- User tabs: `app/navigation/UserTabs.tsx`
  - `Explore` → `ExploreStack`
  - `Profile`

- Explore stack: `app/navigation/ExploreStack.tsx`
  - `Explore` (hub)
  - `Book`, `Clubs`, `Groups`, `Regions`, `RegionDetails`, `Temples`

- Admin tabs: `app/navigation/AdminTabs.tsx`
  - `Dashboard`
  - `AdminManagement` (stack)
  - `Profile`

---

## Getting Started (End Users)

1. Open the app and tap Login (from `Home`).
2. Register if new, or sign in with email/password.
3. You’ll be routed to user tabs or admin tabs based on your role.
4. Start at Explore to browse Books, Regions, Groups, Clubs, and Temples.
5. Use Profile to update display name, photo, and interests.

---

## Authentication

- Login: Firebase Auth email/password. After auth, the app fetches Firestore user document and routes by role. See `screens/Login.tsx`.
- Registration: Creates Auth user and Firestore profile with default role `user`. See `screens/Register.tsx`.
- Forgot Password: Sends reset email via Firebase Auth. See `screens/ForgotPassword.tsx`.
- Profile session: Real-time user doc subscription handled by `services/userService.tsx` (exported as `ProfileService`).

Key helpers (in `services/userService.tsx`):
- `subscribeToAuth`, `subscribeToUserData` for real-time auth/profile.
- `updateUserProfile`, `updateUserProfileWithImage`, `updateLastActive`.
- Joined resources: `updateUserJoinedGroups`, `removeUserFromGroup`, `updateUserJoinedReadingClubs`, `removeUserFromReadingClub`, `saveBookForCurrentUser`, etc.

---

## Explore (User Hub)

Screen: `screens/Explore.tsx`

- Live stats for Users, Books, Regions, Temples, WhatsApp Groups, Reading Clubs, and Book Reports (counts from Firestore using `getCountFromServer` + `onSnapshot`).
- Cards navigate to feature areas:
  - Books → `Book`
  - Local Regions → `Regions`
  - WhatsApp Groups → `Groups`
  - Reading Clubs → `Clubs`
  - Sacred Temples → `Temples`
- Quick actions (visual only): Favorites, Recent, Downloads, Share.

Tips:
- Stats auto-refresh via listeners on `users` and `bookReports` collections.
- Greeting and initials are derived from Auth and user profile.

---

## Screen Reference (What each does)

- `Home.tsx`: Marketing-style entry screen with Login CTA and app branding.
- `About.tsx`: Static about page.
- `Login.tsx`: Authenticates and routes to `UserTabs` or `AdminTabs` by `role`.
- `Register.tsx`: Creates Auth user + Firestore doc with role `user`.
- `ForgotPassword.tsx`: Sends password reset email.
- `Profile.tsx`: User profile management (name, photo, interests, saved/joined entities).
- `Explore.tsx`: Feature hub + live community stats.
- `Regions.tsx` and `RegionDetails.tsx`: Discover regions and their details.
- `Temples.tsx`: List of ISKCON temples (from Firestore `temples`).
- `Groups.tsx`: Join WhatsApp groups (Firestore `whatsapp-groups`).
- `Clubs.tsx`: Discover/join reading clubs (Firestore `reading-clubs`).
- `Book.tsx`: Books library browser (Firestore `books`).
- Admin-only:
  - `Dashboard.tsx`: Overview for admins.
  - `AdminManagement.tsx`: Launcher for content management flows.
  - `AdminBooks.tsx`, `AdminAddBooks.tsx`: Manage and add books.
  - `AdminGroups.tsx`: Manage WhatsApp groups.
  - `AdminRdm.tsx`: Manage regions.
  - `AdminClubs.tsx`: Manage reading clubs.
  - `AdminTemples.tsx`: Manage temples.

---

## Data Models (Firestore)

- `models/user.model.ts` (`users` collection)
  - `uid`, `email`, `displayName`, `photoURL`, `region`, `registrationDate`, `lastActive`, `role` (`user` | `admin` | `facilitator`), plus arrays like `bookInterests`, `joinedGroups`, `joinedReadingClubs`, `savedBooks`.

- `models/book.model.ts` (`books` collection)
  - Fields for title, author, image, description, tags, category, rating, vedabase link, and analytics fields.

- `models/region.model.ts` (`regions` collection)
  - `name`, `description`, `location { latitude, longitude }`, `whatsappGroups`, `ReadingClubs`, `numberoftemples`.

- `models/ReadingClub.model.ts` (`reading-clubs` collection)
  - `name`, `description`, `meetingType`, `schedule`, `currentBookId`, `regionId`, `groupIds`, `facilitator`, `members`, `joinRequests`, `ratings`.

- `models/whatsappGroup.model.ts` (`whatsapp-groups` collection)
  - `name`, `link`, `description`, `regionId`, `groupType`.

- `models/feedback.model.ts` (`feedback` collection)
  - `type`, `rating`, `comment`, `images`, and admin response fields.

---

## Services (How data operations work)

- `services/userService.tsx` (`ProfileService`)
  - Auth/profile listeners, profile updates, role updates.
  - Join/leave groups/clubs, save/remove books.
  - Utility: date formatting, interests parsing, image picking.

- `services/TempleService.ts`
  - CRUD helpers for `temples`; includes `getTemples`, `getTempleById`, and cross-queries with `regions`.

- `services/WhatsappGroupService.ts`
  - Read and specific group operations on `whatsapp-groups`.

- `services/ReadingClubService.ts`
  - Scaffolding for `reading-clubs` CRUD, membership, and cross-collection validation.

- Other utilities
  - `services/ReportGenerationService.ts`: Report creation utilities (e.g., totals/points), integrates with pdf/xlsx in screens.
  - `services/ScrollableService.ts`: UI/data helpers for scrollable lists.

---

## Admin Guide (Managing Content)

1. Log in with an admin account (your Firestore `role` must be `admin`).
2. Go to `AdminManagement` from the admin tabs.
3. Choose a task:
   - Rate Books / Add Books
   - Add Groups (WhatsApp)
   - Add Regions
   - Add Book Clubs
   - Manage Temples
4. Use the forms to create or update items; data is stored in Firestore collections listed above.

Tip: For relationships (e.g., temple belongs to region), ensure you have the region created first and reference its `id`.

---

## Common Tasks (How-To)

- Update profile name/photo
  1. Open `Profile`.
  2. Edit display name. For photo, choose Gallery or Camera.
  3. Save; the app updates Firestore and, when applicable, Firebase Auth.

- Register a new account
  1. From `Home`, tap **Login** then **Register**.
  2. Enter your name, email, and a password (confirm it).
  3. Tap **Create Account**. You’ll see a success message.
  4. Go back to **Login** and sign in with your email and password.
  5. You’ll land on Explore as a standard user.

- Join a WhatsApp group
  1. Explore → WhatsApp Groups.
  2. Open a group and tap join/open link.
  3. Your `joinedGroups` can be updated via `ProfileService.updateUserJoinedGroups` where implemented.

- Join a reading club
  1. Explore → Reading Clubs.
  2. Open a club and request to join.
  3. Your `joinedReadingClubs` is updated accordingly.

- Save a book for later
  - Use `ProfileService.saveBookForCurrentUser(bookId)` from the book view UI where wired.

- Add or edit a book (Admins)
  1. Log in as an admin (your account’s role must be `admin`).
  2. Go to **AdminManagement** → **Add Books**.
  3. To add a single book: fill in Title and Author (required), optional fields like Description, Year, BBT link, Category, Language, Format, and Rating. Tap **Add**.
  4. To edit a book: tap the edit icon next to a book, adjust fields, then save.
  5. To delete a book: tap the delete icon and confirm.
  6. To bulk upload: tap **Upload** and choose a JSON or CSV file that matches the template. You can download a template CSV from the same screen.

- How ratings work (Books)
  - Each book has a rating shown as stars (0–5). In the current version, ratings displayed are values stored with the book. If your app includes user ratings, look for a star tap action on the book details or list—otherwise ratings are set by admins when adding/editing a book.

---

## Setup & Running Locally

1. Install dependencies:
   - `npm install`
2. Copy Firebase config into `firebaseCo.js` and ensure Firebase project/collections exist.
3. Start the app:
   - `npx expo start`
4. Open on device (Expo Go), emulator, or web.

Required environment:
- Firebase Auth enabled (Email/Password)
- Firestore collections: `users`, `books`, `regions`, `temples`, `whatsapp-groups`, `reading-clubs`, `bookReports`

---

## Troubleshooting

- Cannot log in: Verify Firebase Auth credentials and that Firestore has a `users/{uid}` document.
- Routed to wrong area: Check Firestore `users/{uid}.role` (should be `admin` for admin tabs).
- Stats not showing: Confirm Firestore security rules and that counts are accessible to the client.
- Images not updating in Auth: Large base64 images are stored in Firestore but intentionally skipped for Auth photoURL limits; prefer hosted URLs.
- Permission errors: Ensure Firestore rules allow reads/writes for your role and environment.

---

## FAQ

- How do I add a new region?
  - Admin → AdminManagement → Add Regions. Provide name and location; link groups/clubs later.

- Where are relationships stored?
  - References are stored by IDs across collections (e.g., `temples.regionId`, `reading-clubs.regionId`, `groupIds`).

- Can I export reports?
  - Yes, report utilities exist (`ReportGenerationService`) and some screens integrate with PDF/XLSX.

---

## Support

For admin access changes or data corrections, update the user’s document in Firestore (`users/{uid}.role`). For technical issues, review console logs and Firebase logs, then escalate with details of the action taken and any error messages.


