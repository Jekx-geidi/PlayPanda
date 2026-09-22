# PlayPanda — Login Page Requirements

## 1. Overview

The PlayPanda Login Page is the secure entry point for authorized users who need access to tournament management and scoring features.

PlayPanda supports both **Sports** and **E-Sports** tournaments, so the login experience should be simple, fast, mobile-friendly, and consistent with the PlayPanda brand.

The preferred authentication method is:

- **Google Sign-In**
- No manual password creation for the initial version
- Role-based access after authentication

---

## 2. Purpose

The Login Page should allow approved users to:

- Sign in securely using their Google account
- Access the correct PlayPanda dashboard based on their assigned role
- Return to the public PlayPanda website if they do not want to log in
- Receive clear feedback when access is denied or authentication fails

---

## 3. Supported User Roles

### 3.1 Admin

Admins manage the tournament platform.

Possible Admin capabilities include:

- Create tournaments
- Edit tournament information
- Manage Sports and E-Sports events
- Manage teams and players
- Assign scorers
- Manage schedules
- Manage brackets
- Review match results
- Publish tournament results
- View tournament status
- Access tournament management settings

---

### 3.2 Scorer

Scorers are assigned to specific matches or tournament games.

Possible Scorer capabilities include:

- View assigned matches
- Open the scoring interface
- Enter scores
- Update match progress
- Submit final scores
- Review submitted match results

Scorers should only see the tournaments and matches assigned to them.

---

## 4. Authentication Method

### Google Sign-In

The primary login button should be:

> **Continue with Google**

The system should use Google authentication to identify the user.

### Login Flow

1. User opens the PlayPanda Login Page.
2. User clicks **Continue with Google**.
3. Google authentication window opens.
4. User selects or enters their Google account.
5. Google verifies the account.
6. PlayPanda checks whether the authenticated email has access.
7. The system identifies the user's assigned role.
8. The user is redirected to the correct dashboard.

### Example Redirection

| Role | Destination |
|---|---|
| Admin | Admin Dashboard |
| Scorer | Scorer Dashboard |
| Unassigned User | Access Pending / Unauthorized Page |

---

## 5. Login Page Layout

The login page should follow the existing PlayPanda visual style.

### Desktop Layout

Recommended layout:

**Left Side**

- Large PlayPanda mascot
- Tournament-related decorative elements
- Short PlayPanda message

Example:

> **Ready to Play?**  
> Sign in and manage the action from game start to final score.

**Right Side**

Login card containing:

- PlayPanda logo
- Heading
- Supporting text
- Google Sign-In button
- Terms / Privacy notice
- Back to Home link

---

## 6. Login Card Content

### Logo

Display:

**PlayPanda**

Use the official PlayPanda logo and brand mark.

---

### Heading

Recommended:

# Welcome Back

Supporting text:

> Sign in to continue to your PlayPanda tournament dashboard.

---

### Google Login Button

Button text:

> **Continue with Google**

Recommended visual:

- White button
- Google icon on the left
- Dark readable text
- Full-width button
- Clear hover state

---

### Secondary Link

Below the authentication button:

> Not here to manage a tournament? **Back to Home**

---

## 7. Alternative Login Copy

The UI can use one of the following headline options.

### Option A

**Welcome Back**

> Sign in to manage tournaments, matches, and live scores.

### Option B

**Ready for the Next Match?**

> Sign in to access your PlayPanda tournament dashboard.

### Option C

**Game On.**

> Continue with Google to manage the competition.

Recommended default:

> **Welcome Back**  
> Sign in to continue to your PlayPanda tournament dashboard.

---

## 8. Visual Design

The login page should use the existing PlayPanda dark sports theme.

### Main Colors

- Background: Near Black / Dark Navy
- Primary Brand: PlayPanda Mint Green
- Secondary: White
- Accent: Yellow or Purple where appropriate
- Muted text: Gray

Example palette:

```text
Background      #07100F
Surface         #0D1918
Primary Green   #3DDC97
White           #F7F9F8
Muted Text      #8F9D9A
Yellow Accent   #FFC83D
Purple Accent   #B85CFF
```

Use the actual approved PlayPanda green from the logo when available.

---

## 9. Mascot Usage

The PlayPanda mascot can appear on the login page.

Recommended version:

- Head or half-body mascot
- Smiling
- Winking
- Wearing the PlayPanda green/black outfit
- Positioned beside the login panel
- Decorative only and should not interfere with the login form

Optional speech line:

> **Let's get the tournament started!**

---

## 10. Responsive Design

The login page must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile

### Desktop

Use a two-column layout:

```text
Mascot / Brand Area | Login Card
```

### Tablet

Reduce mascot size and maintain two-column layout where space permits.

### Mobile

Use a single-column layout:

```text
PlayPanda Logo
Mascot
Login Card
```

The Google Sign-In button should remain easy to tap.

Recommended minimum button height:

```text
48px
```

---

## 11. Loading State

When authentication begins:

- Disable the Google login button
- Show loading indicator
- Display:

> **Signing you in...**

Prevent duplicate login requests while loading.

---

## 12. Authentication Error States

### Google Login Failed

Message:

> **We couldn't sign you in. Please try again.**

Button:

> Try Again

---

### User Has No PlayPanda Access

Message:

> **Your Google account is not currently connected to a PlayPanda role.**

Supporting text:

> Contact the tournament administrator if you believe you should have access.

Button:

> Back to Home

---

### Account Not Assigned to Tournament

For scorers:

> **You currently have no assigned matches.**

Supporting text:

> Your tournament administrator will assign matches to your account.

---

## 13. Logged-In User Handling

If an authenticated user visits `/login`:

- Check the user's role
- Automatically redirect them to their dashboard

Example:

```text
Admin  -> /admin
Scorer -> /scorer
```

The user should not need to log in again while their session is still valid.

---

## 14. Logout

Both Admin and Scorer dashboards should provide a logout option.

Recommended flow:

1. User clicks profile/avatar.
2. Dropdown opens.
3. User clicks **Log Out**.
4. Authentication session is cleared.
5. User returns to the Login Page or Home Page.

---

## 15. Suggested URLs

```text
/login

/admin

/scorer

/unauthorized
```

Possible future routes:

```text
/profile
/tournaments
/matches
/settings
```

---

## 16. Access Control

Authentication and authorization must be treated separately.

### Authentication

Confirms:

> Who is this user?

Handled through Google Sign-In.

### Authorization

Confirms:

> What is this user allowed to access?

Handled using PlayPanda roles.

Example:

```text
ADMIN
SCORER
```

Users must not be able to access another role's protected pages by manually changing the URL.

---

## 17. Security Requirements

The system should:

- Use secure Google OAuth authentication
- Never store Google passwords
- Protect Admin routes
- Protect Scorer routes
- Verify authorization on protected requests
- Reject unauthorized users
- Use secure session handling
- Clear sessions properly on logout
- Avoid exposing sensitive authentication information in the frontend

---

## 18. Functional Requirements

### FR-LOGIN-001

The system shall provide a PlayPanda Login Page.

### FR-LOGIN-002

The system shall allow users to authenticate through Google.

### FR-LOGIN-003

The system shall identify the authenticated user's PlayPanda role.

### FR-LOGIN-004

The system shall redirect Admin users to the Admin Dashboard.

### FR-LOGIN-005

The system shall redirect Scorer users to the Scorer Dashboard.

### FR-LOGIN-006

The system shall prevent unauthorized users from accessing protected pages.

### FR-LOGIN-007

The system shall display a clear message when authentication fails.

### FR-LOGIN-008

The system shall provide logout functionality.

### FR-LOGIN-009

The Login Page shall be responsive across mobile, tablet, laptop, and desktop screens.

### FR-LOGIN-010

The Login Page shall use PlayPanda branding, colors, logo, and mascot assets.

---

## 19. UX Requirements

The login experience should be:

- Simple
- Fast
- Minimal
- Sports-oriented
- Easy for non-technical users
- Clear about what account is being used
- Consistent with the main PlayPanda website

The page should avoid unnecessary fields because Google authentication is the primary login method.

---

## 20. Suggested Page Wireframe

```text
+---------------------------------------------------------------+
|                                                               |
|       PLAYPANDA MASCOT            PLAYPANDA LOGO               |
|                                                               |
|       Ready for the              Welcome Back                  |
|       next match?                                             |
|                                   Sign in to continue to your  |
|       [Mascot Image]              tournament dashboard.        |
|                                                               |
|                                   +-------------------------+  |
|                                   | G  Continue with Google |  |
|                                   +-------------------------+  |
|                                                               |
|                                   Not here to manage?          |
|                                   Back to Home                 |
|                                                               |
+---------------------------------------------------------------+
```

---

## 21. Mobile Wireframe

```text
+----------------------------+
|        PLAYPANDA           |
|                            |
|        [Mascot]            |
|                            |
|       Welcome Back         |
|                            |
| Sign in to continue to     |
| your tournament dashboard. |
|                            |
| +------------------------+ |
| | Continue with Google   | |
| +------------------------+ |
|                            |
|      Back to Home          |
+----------------------------+
```

---

## 22. Acceptance Criteria

The Login Page is considered complete when:

- PlayPanda branding is correctly displayed
- Google authentication works
- Admin users reach the Admin Dashboard
- Scorer users reach the Scorer Dashboard
- Unauthorized users cannot access protected dashboards
- Login errors display understandable messages
- Existing authenticated users are redirected correctly
- Logout works correctly
- The page is usable on mobile, tablet, and desktop
- The mascot and UI match the PlayPanda visual identity

---

## 23. Future Enhancements

Possible future additions:

- Player accounts
- Team Captain accounts
- Tournament Organizer accounts
- Email notifications
- Account profile management
- Invite-based access
- Tournament-specific permissions
- Sign-in history
- Account activity logs
- Additional OAuth providers

These are not required for the initial Login Page unless later approved.

---

# Recommended MVP

For the first PlayPanda login implementation, keep it simple:

```text
Google Sign-In
      |
      v
Check User
      |
      +--> Admin  ---> Admin Dashboard
      |
      +--> Scorer ---> Scorer Dashboard
      |
      +--> Unknown ---> Access Denied
```

This gives PlayPanda a clean authentication foundation without making the first version unnecessarily complicated.
