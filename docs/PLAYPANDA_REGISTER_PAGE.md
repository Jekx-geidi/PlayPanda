# PlayPanda — Registration Page Requirements

## 1. Overview

The PlayPanda Registration Page allows new users to create a PlayPanda account before joining or managing tournaments.

PlayPanda supports both **Sports** and **E-Sports**, so the registration experience must be simple, fast, secure, mobile-friendly, and consistent with the existing PlayPanda dark sports visual identity.

For the initial version, the preferred authentication method is:

- Google Sign-In / Google Sign-Up
- No manual password creation
- User profile setup after Google authentication
- Role-based access controlled by PlayPanda
- Admin and Scorer permissions must not be freely self-assigned

---

# 2. Registration Goal

The registration page should allow a new user to:

1. Create a PlayPanda account using Google.
2. Complete a basic PlayPanda profile.
3. Accept the Terms and Privacy Policy.
4. Choose how they intend to use PlayPanda when applicable.
5. Continue into the correct onboarding flow.
6. Register for tournaments later using the same account.

---

# 3. Recommended User Registration Model

PlayPanda should separate:

## 3.1 Public Account Registration

Users may create a normal PlayPanda account.

A normal account can later be used for:

- Joining tournaments
- Registering as a player
- Joining a team
- Creating a team
- Viewing personal tournament history
- Viewing schedules
- Viewing brackets
- Viewing live scores
- Receiving tournament invitations

---

## 3.2 Protected Operational Roles

The following roles should NOT be available as public self-selection:

- Admin
- Scorer

These roles should only be assigned through:

- Admin invitation
- Admin approval
- Internal user management

This prevents a normal visitor from registering and giving themselves access to scoring or administrative tools.

---

# 4. Registration Types

The system should support these registration paths.

## A. Standard User Registration

For players, participants, team members, or general users.

Flow:

```text
Register
   ↓
Continue with Google
   ↓
Google Authentication
   ↓
Complete Profile
   ↓
Accept Terms
   ↓
Create Account
   ↓
User Dashboard / Tournament Discovery
```

---

## B. Invited Scorer Registration

A Scorer receives a PlayPanda invitation.

Flow:

```text
Scorer Invitation Link
   ↓
Register / Continue with Google
   ↓
Verify Email Against Invitation
   ↓
Complete Profile
   ↓
Scorer Role Assigned
   ↓
Scorer Dashboard
```

The Google email must match the invited email unless the Admin changes the invitation.

---

## C. Invited Admin Registration

An Admin receives an invitation from an authorized PlayPanda Admin.

Flow:

```text
Admin Invitation Link
   ↓
Continue with Google
   ↓
Verify Invitation
   ↓
Complete Profile
   ↓
Admin Role Assigned
   ↓
Admin Dashboard
```

---

# 5. Registration Page Route

Recommended main route:

```text
/register
```

Related routes:

```text
/login
/register
/register/profile
/register/success
/invite/:token
/unauthorized
/admin
/scorer
/profile
```

---

# 6. Page Layout

The Registration Page should visually match the Login Page.

Recommended desktop layout:

```text
+--------------------------------------------------------------------+
|                                                                    |
|  PLAYPANDA BRAND / MASCOT            CREATE YOUR ACCOUNT            |
|                                                                    |
|  [Mascot Illustration]               Join PlayPanda and get ready   |
|                                      for your next competition.      |
|                                                                    |
|                                      [ Continue with Google ]       |
|                                                                    |
|                                      Already have an account?       |
|                                      Log In                          |
|                                                                    |
+--------------------------------------------------------------------+
```

---

# 7. Left-Side Visual Area

Recommended content:

## Eyebrow

```text
# Join The Competition
```

## Main Heading

```text
Your Next Match
Starts Here.
```

## Supporting Text

```text
Create your PlayPanda account to join tournaments,
track matches, and stay connected to the competition.
```

## Mascot

Use a PlayPanda mascot variation specifically for registration.

Suggested pose:

- Wearing PlayPanda sportswear
- Holding a clipboard, phone, tournament card, or ball
- Energetic and welcoming
- Smiling or winking
- No distracting background

Optional decorative elements:

- Small bracket lines
- Score numbers
- Basketball / volleyball / football / shuttlecock icons
- E-Sports controller icon
- PlayPanda green motion strokes

---

# 8. Registration Card

The registration card should contain:

1. PlayPanda logo
2. Heading
3. Supporting text
4. Google Sign-Up button
5. Terms acknowledgement
6. Login link

---

# 9. Recommended Registration Copy

## Heading

```text
Create Your Account
```

## Supporting Text

```text
Join PlayPanda and get ready for your next competition.
```

## Google Button

```text
Continue with Google
```

## Existing Account

```text
Already have an account? Log In
```

## Terms Notice

```text
By continuing, you agree to PlayPanda's Terms of Service
and Privacy Policy.
```

---

# 10. Alternative Headline Options

### Option A

```text
Join PlayPanda
Your next competition starts here.
```

### Option B

```text
Ready To Compete?
Create your account and enter the game.
```

### Option C

```text
Game On.
Create your PlayPanda account to get started.
```

Recommended default:

```text
Create Your Account
Join PlayPanda and get ready for your next competition.
```

---

# 11. Google Registration Flow

When the user clicks:

```text
Continue with Google
```

the system should:

1. Open Google authentication.
2. Allow the user to select a Google account.
3. Receive verified identity information from Google.
4. Check if the email already exists in PlayPanda.
5. If the account already exists:
   - Sign the user in.
   - Redirect based on role.
6. If the account is new:
   - Create a pending PlayPanda profile.
   - Redirect to Profile Setup.

---

# 12. Duplicate Account Handling

If the Google email already has an account:

Do not create another account.

Instead:

```text
This Google account is already registered.
Signing you in...
```

Then redirect the user.

Example:

```text
Normal User → User Dashboard
Admin       → Admin Dashboard
Scorer      → Scorer Dashboard
```

---

# 13. Profile Setup Page

After Google authentication, new users should complete their basic profile.

Recommended route:

```text
/register/profile
```

---

# 14. Profile Fields

## Required Fields

### Full Name

Automatically populated from Google when available.

Field:

```text
Full Name
```

Validation:

- Required
- 2–100 characters
- Letters, spaces, hyphens, apostrophes allowed

---

### Email Address

Automatically populated from Google.

Field:

```text
Email Address
```

Rules:

- Read-only
- Verified through Google
- Cannot be manually changed during registration

---

### Display Name

Used publicly in PlayPanda.

Example:

```text
Riel Jake
```

Validation:

- Required
- 2–40 characters
- Must not contain offensive or invalid content

---

### User Type

Recommended options for public registration:

```text
Player
Team Representative
Tournament Organizer
Spectator / Other
```

Important:

```text
Admin
Scorer
```

must NOT appear as normal self-registration choices.

These are invitation-only roles.

---

## Optional Fields

### Profile Photo

Default:

- Google profile photo

Allow the user to change later in Profile Settings.

---

### Contact Number

Optional during MVP.

Recommended Philippines format support:

```text
+63XXXXXXXXXX
```

Do not require this unless tournament operations need it.

---

### Location

Optional.

Recommended:

```text
City / Area
```

Do not require precise location.

---

# 15. User Type Descriptions

## Player

```text
Join competitions, teams, and tournaments.
```

## Team Representative

```text
Register and manage a team participating in tournaments.
```

## Tournament Organizer

```text
Create or manage competitions when organizer access is available.
```

## Spectator / Other

```text
Follow tournaments, live scores, brackets, and results.
```

---

# 16. Recommended MVP Profile Form

For the first version, keep registration short.

```text
Full Name       [Automatically Filled]
Email           [Automatically Filled / Read Only]
Display Name    [_____________________]

I want to use PlayPanda as:

( ) Player
( ) Team Representative
( ) Tournament Organizer
( ) Spectator / Other

[ ] I agree to the Terms of Service and Privacy Policy

[ COMPLETE REGISTRATION ]
```

---

# 17. Terms and Privacy

Registration should require:

```text
[ ] I agree to the Terms of Service and Privacy Policy.
```

The checkbox must be required before completing registration.

The Terms and Privacy Policy should open in:

- New page
- Modal
- Dedicated legal page

Recommended routes:

```text
/terms
/privacy
```

---

# 18. Registration Success

After successful account creation:

Display:

```text
Welcome to PlayPanda!
```

Supporting message:

```text
Your account is ready. Let's find your next competition.
```

Buttons:

```text
EXPLORE TOURNAMENTS
VIEW MY PROFILE
```

Optional mascot celebration illustration can appear here.

---

# 19. Normal User Destination

Recommended user dashboard route:

```text
/dashboard
```

The normal user dashboard can eventually show:

- Upcoming tournaments
- Registered tournaments
- Team memberships
- Upcoming matches
- Recent results
- Tournament invitations
- Live tournaments
- Player profile

For MVP, the user may simply be redirected to:

```text
/tournaments
```

after registration.

---

# 20. Scorer Invitation Flow

Scorers should be registered through invitation.

Example Admin process:

1. Admin opens User Management.
2. Admin clicks:
   ```text
   Invite Scorer
   ```
3. Admin enters scorer email.
4. System generates an invitation.
5. Invitation is sent or copied.
6. Scorer opens invitation.
7. Scorer signs in with Google.
8. PlayPanda verifies the email.
9. Scorer completes profile.
10. Scorer receives Scorer access.

---

# 21. Scorer Invitation Page

Recommended copy:

```text
You've Been Invited
```

```text
You've been invited to join PlayPanda as a Scorer.
Continue with the invited Google account to get started.
```

Button:

```text
ACCEPT INVITATION WITH GOOGLE
```

---

# 22. Invalid Scorer Email

If the Google account does not match the invitation:

```text
This Google account does not match the invited email.
```

Show:

```text
Invited email: r***@example.com
```

Do not expose the complete email unnecessarily if privacy is a concern.

Button:

```text
TRY ANOTHER GOOGLE ACCOUNT
```

---

# 23. Admin Invitation Flow

Admin registration should follow the same invite verification model.

Admin role assignment must only happen after a valid invitation.

Never provide:

```text
Register as Admin
```

as a public option.

---

# 24. Registration Error States

## Google Authentication Failed

Message:

```text
We couldn't create your account.
Please try again.
```

Button:

```text
TRY AGAIN
```

---

## Google Popup Closed

Message:

```text
Registration was cancelled.
Continue when you're ready.
```

---

## Email Already Registered

Message:

```text
You already have a PlayPanda account.
```

Button:

```text
CONTINUE TO LOGIN
```

The system may also automatically authenticate the user.

---

## Invalid Invitation

Message:

```text
This invitation is invalid or has expired.
```

Supporting text:

```text
Ask your tournament administrator for a new invitation.
```

---

## Network Error

Message:

```text
Something went wrong while connecting to PlayPanda.
Please check your connection and try again.
```

---

## Terms Not Accepted

Inline validation:

```text
Please accept the Terms of Service and Privacy Policy to continue.
```

---

# 25. Loading States

When Google registration begins:

Button changes from:

```text
Continue with Google
```

to:

```text
Connecting to Google...
```

Disable repeated clicks.

During profile creation:

```text
Creating your PlayPanda account...
```

---

# 26. Registration Button States

## Default

```text
COMPLETE REGISTRATION
```

## Hover

- Slightly brighter PlayPanda green
- Small arrow movement
- Sporty visual feedback

## Loading

```text
CREATING ACCOUNT...
```

## Disabled

Used when:

- Required fields are incomplete
- Terms checkbox is unchecked

---

# 27. Visual Design

Use the established PlayPanda style.

## Background

Dark:

```text
#07100F
```

or equivalent approved dark brand color.

## Cards

Recommended:

```text
#0D1918
```

with subtle border:

```text
rgba(61, 220, 151, 0.20)
```

## Primary Green

Use the official PlayPanda logo green.

Example:

```text
#3DDC97
```

## Main Text

```text
#F7F9F8
```

## Muted Text

```text
#8F9D9A
```

## Warning / Accent

Yellow:

```text
#FFC83D
```

## Secondary Accent

Purple:

```text
#B85CFF
```

---

# 28. Registration Form Design

Form fields should use:

- Dark input backgrounds
- Thin muted border
- Green focus border
- White input text
- Clear labels
- Visible validation messages

Example:

```text
Display Name
┌─────────────────────────────┐
│ Riel Jake                   │
└─────────────────────────────┘
```

Focused:

```text
Green outline / glow
```

Error:

```text
Red or orange border
```

---

# 29. Password Fields

For the MVP using Google-only authentication:

Do NOT display:

- Password
- Confirm Password
- Forgot Password

because PlayPanda is not managing user passwords.

This keeps registration simpler and more secure.

---

# 30. Navigation

Registration page header should be minimal.

Recommended:

```text
PlayPanda Logo
                         Back to Home
```

Avoid displaying the complete public navigation if it distracts from registration.

Optional:

```text
Already have an account? Log In
```

in the upper-right.

---

# 31. Responsive Behavior

The page must work on:

- Desktop
- Laptop
- Tablet
- Mobile

---

## Desktop

Two-column layout:

```text
Mascot / Brand Content | Registration Card
```

Suggested width:

```text
50% | 50%
```

or:

```text
55% | 45%
```

---

## Tablet

Can remain two-column when space allows.

Otherwise:

```text
Brand Content
Registration Form
```

---

## Mobile

Single-column:

```text
PlayPanda Logo
Small Mascot
Create Your Account
Google Button
Profile Form
Terms
Register Button
Login Link
```

Mascot should be reduced significantly to prioritize the form.

---

# 32. Accessibility

The registration page should support:

- Keyboard navigation
- Visible focus states
- Proper HTML labels
- Sufficient contrast
- Screen-reader-friendly error messages
- Buttons at least approximately 44–48px tall
- Form fields easy to tap on mobile

Do not rely only on color to communicate errors.

---

# 33. Session Behavior

After registration:

- Create authenticated session
- Keep the user logged in
- Redirect to appropriate destination

The user should not need to log in again immediately after registering.

---

# 34. Authorization Rules

Registration creates identity.

Authorization determines access.

Example:

```text
USER
TEAM_REPRESENTATIVE
ORGANIZER
SCORER
ADMIN
```

Recommended security principle:

```text
Users cannot assign themselves ADMIN or SCORER.
```

These must be assigned server-side through verified invitations or Admin User Management.

---

# 35. Suggested Role Structure

For the platform:

```text
USER
SCORER
ADMIN
```

Then use profile metadata for normal-user purposes:

```text
PLAYER
TEAM_REPRESENTATIVE
ORGANIZER
SPECTATOR
```

This prevents business profile types from becoming security permissions.

---

# 36. Suggested Data Structure

Example conceptual user record:

```json
{
  "id": "uuid",
  "google_id": "google-user-id",
  "email": "user@example.com",
  "full_name": "Riel Jake",
  "display_name": "Riel",
  "avatar_url": "https://...",
  "role": "USER",
  "user_type": "PLAYER",
  "status": "ACTIVE",
  "terms_accepted": true,
  "terms_accepted_at": "timestamp",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

For invited scorer:

```json
{
  "role": "SCORER"
}
```

For Admin:

```json
{
  "role": "ADMIN"
}
```

---

# 37. Suggested Invitation Structure

```json
{
  "id": "uuid",
  "email": "scorer@example.com",
  "role": "SCORER",
  "token": "secure-random-token",
  "status": "PENDING",
  "expires_at": "timestamp",
  "created_by": "admin-user-id",
  "accepted_at": null
}
```

Possible statuses:

```text
PENDING
ACCEPTED
EXPIRED
REVOKED
```

---

# 38. Functional Requirements

## REG-FR-001

The system shall provide a public registration page at:

```text
/register
```

## REG-FR-002

The system shall allow users to register using Google authentication.

## REG-FR-003

The system shall prevent duplicate accounts for the same Google identity/email.

## REG-FR-004

The system shall allow a new user to complete a basic PlayPanda profile.

## REG-FR-005

The system shall require acceptance of Terms of Service and Privacy Policy.

## REG-FR-006

The system shall create the user's account after successful authentication and profile completion.

## REG-FR-007

The system shall automatically authenticate the user after registration.

## REG-FR-008

The system shall redirect successfully registered users to the appropriate destination.

## REG-FR-009

The system shall prevent public users from assigning themselves Admin access.

## REG-FR-010

The system shall prevent public users from assigning themselves Scorer access.

## REG-FR-011

The system shall support invitation-based Scorer registration.

## REG-FR-012

The system shall support invitation-based Admin registration.

## REG-FR-013

The system shall validate invitation tokens before assigning protected roles.

## REG-FR-014

The system shall display clear registration errors.

## REG-FR-015

The registration interface shall be responsive across desktop, tablet, and mobile devices.

---

# 39. Non-Functional Requirements

## Performance

The registration page should load quickly and avoid unnecessarily large assets.

Mascot images should be optimized.

---

## Security

The system should:

- Use secure Google OAuth
- Never store Google passwords
- Validate authentication server-side
- Validate protected role assignment server-side
- Protect invitation tokens
- Expire invitation links
- Prevent reuse of accepted invitation tokens
- Prevent duplicate Google identities
- Use secure session cookies/tokens
- Use HTTPS in production

---

## Privacy

Only collect information necessary for PlayPanda.

Avoid requiring:

- Home address
- Precise location
- Government ID
- Sensitive personal information

unless a future tournament-specific requirement genuinely needs it.

---

# 40. Suggested Registration User Flow

```text
                     ┌──────────────┐
                     │   REGISTER   │
                     └──────┬───────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Continue w/ Google│
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Google Auth       │
                  └─────────┬─────────┘
                            │
                   Existing Account?
                    /               \
                  YES               NO
                   │                 │
                   ▼                 ▼
             Sign User In      Profile Setup
                   │                 │
                   │                 ▼
                   │          Accept Terms
                   │                 │
                   │                 ▼
                   │          Create Account
                   │                 │
                   └────────┬────────┘
                            ▼
                     User Dashboard
```

---

# 41. Invitation Flow

```text
Admin Creates Invitation
          │
          ▼
Invitation Link
          │
          ▼
Continue with Google
          │
          ▼
Verify Google Email
          │
          ▼
Verify Invitation Token
          │
      ┌───┴────┐
      │        │
    Valid    Invalid
      │        │
      ▼        ▼
Assign Role  Show Error
      │
      ▼
Complete Profile
      │
      ▼
Dashboard
```

---

# 42. Suggested Desktop Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ PLAYPANDA                                      Back to Home  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│     # Join The Competition        CREATE YOUR ACCOUNT        │
│                                                              │
│     YOUR NEXT MATCH              Join PlayPanda and get     │
│     STARTS HERE.                 ready for your next         │
│                                 competition.                 │
│                                                              │
│     [ PLAYPANDA MASCOT ]         ┌───────────────────────┐   │
│                                 │ G Continue with Google│   │
│                                 └───────────────────────┘   │
│                                                              │
│                                 By continuing, you agree    │
│                                 to our Terms & Privacy.      │
│                                                              │
│                                 Already registered?         │
│                                 Log In                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 43. Profile Setup Wireframe

```text
┌─────────────────────────────────────┐
│         Complete Your Profile       │
│                                     │
│ [Avatar] Riel Jake                  │
│          user@gmail.com             │
│                                     │
│ Display Name                        │
│ ┌─────────────────────────────────┐ │
│ │ Riel                            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ How will you use PlayPanda?         │
│                                     │
│ ○ Player                            │
│ ○ Team Representative               │
│ ○ Tournament Organizer              │
│ ○ Spectator / Other                 │
│                                     │
│ □ I agree to Terms & Privacy        │
│                                     │
│ [ COMPLETE REGISTRATION ]           │
└─────────────────────────────────────┘
```

---

# 44. Mobile Wireframe

```text
┌───────────────────────────┐
│        PLAYPANDA          │
│                           │
│       [Mascot]            │
│                           │
│   Create Your Account     │
│                           │
│ Join PlayPanda and get    │
│ ready for your next       │
│ competition.              │
│                           │
│ ┌───────────────────────┐ │
│ │ Continue with Google  │ │
│ └───────────────────────┘ │
│                           │
│ By continuing, you agree  │
│ to Terms & Privacy.       │
│                           │
│ Already have an account?  │
│ Log In                    │
└───────────────────────────┘
```

---

# 45. Registration Acceptance Criteria

The registration feature is considered complete when:

- `/register` is available.
- The page matches PlayPanda branding.
- Google Sign-Up works.
- Existing Google users do not receive duplicate accounts.
- New users can complete their profile.
- Required fields are validated.
- Terms acceptance is required.
- Successful registration creates an authenticated session.
- Users are redirected correctly.
- Public users cannot register themselves as Admin.
- Public users cannot register themselves as Scorer.
- Scorer invitations are validated.
- Admin invitations are validated.
- Expired or invalid invitations are rejected.
- Registration errors are understandable.
- The interface works on mobile, tablet, laptop, and desktop.
- The registration page visually matches the existing Login Page.

---

# 46. Recommended MVP Scope

For the first implementation:

## Include

- Google registration
- Basic PlayPanda profile
- Display name
- User type
- Terms acceptance
- Existing-account detection
- Login redirect
- Responsive design
- Scorer invitation support
- Admin invitation support

## Do Not Require Yet

- Username/password registration
- SMS verification
- Phone verification
- Multi-factor authentication
- Social providers other than Google
- Detailed player statistics
- Full team creation during signup
- Tournament registration inside the account-creation form

Keep account registration separate from tournament registration.

---

# 47. Important Product Rule

Account registration and tournament registration are different actions.

```text
ACCOUNT REGISTRATION
Who are you in PlayPanda?
```

versus:

```text
TOURNAMENT REGISTRATION
Which tournament / team / event are you joining?
```

A user should create their PlayPanda account once.

After that, the same account can participate in multiple tournaments.

---

# 48. Final Recommended Flow

For the PlayPanda MVP:

```text
REGISTER PAGE
     ↓
GOOGLE
     ↓
PROFILE SETUP
     ↓
NORMAL USER ACCOUNT
     ↓
EXPLORE / JOIN TOURNAMENTS
```

For protected roles:

```text
ADMIN INVITE ──→ GOOGLE ──→ VERIFY ──→ ADMIN

SCORER INVITE ─→ GOOGLE ──→ VERIFY ──→ SCORER
```

This keeps registration easy for users while protecting PlayPanda's tournament administration and live-scoring tools.
