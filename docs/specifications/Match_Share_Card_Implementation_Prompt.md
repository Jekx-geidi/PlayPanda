Oo po, gets. Ang imong need kay **implementation prompt para kay Claude**, dili image template. Mao ni ang pwede nimo i-paste directly kay Claude:

> **Claude Prompt**
>
> We are building **PlayPanda**, a React-based sports and e-sports platform. I want you to add a new feature called **Game Share Card / Match Story Share**.
>
> The purpose of this feature is similar to how Strava lets users share an activity to Instagram/Facebook Stories, but PlayPanda should use verified game/match data.
>
> Do not replace the current React architecture. Reuse the existing PlayPanda branding, logo, dark sports UI, green brand color, and mascot assets already available in the project.
>
> ## Core Feature
>
> After a match is completed and the result is verified, the player should see an option:
>
> **Share Your Match**
>
> The user can choose whether to share it or not.
>
> If they choose to share, open a **Share Match Builder**.
>
> The generated share card should automatically pull data from the actual match:
>
> * Player/team name
> * Opponent
> * WIN / LOSS / DRAW
> * Final score
> * Sport or game
> * Event/division if available
> * Tournament name if applicable
> * Match date
> * Match time
> * Current wins
> * Current losses
> * Matches played
> * Win rate if available
>
> Example:
>
> ```text
> WIN
>
> 21–18 • 21–15
>
> Pickleball Singles
> September 25, 2026 • 3:00 PM
>
> Wins: 12
> Losses: 3
>
> YOU ARE AN EXPERT IN PICKLEBALL!
> ```
>
> ## Dynamic Engagement Statement
>
> Add a short generated statement based on the result and player's statistics.
>
> Examples:
>
> * `YOU ARE AN EXPERT IN PICKLEBALL!`
> * `ANOTHER WIN FOR THE RECORD!`
> * `3 WINS IN A ROW!`
> * `YOU OWNED THE COURT TODAY!`
> * `GREAT BATTLE. KEEP PUSHING!`
> * `NEW PERSONAL MILESTONE!`
> * `CHAMPIONSHIP ENERGY!`
>
> The statement should not always claim the player is an expert. It must depend on actual match context and statistics.
>
> If the player loses, use positive but accurate messages such as:
>
> * `TOUGH MATCH. STRONG PERFORMANCE.`
> * `THE COMEBACK STARTS HERE.`
> * `GOOD GAME. ON TO THE NEXT ONE.`
>
> Do not generate misleading claims.
>
> ## Actual Game Photo
>
> The user should be able to upload one or more photos from the actual game.
>
> For the Share Card, allow them to select one photo as the main background/photo.
>
> The PlayPanda overlay should be placed on top of their selected image.
>
> Do not permanently modify the original uploaded photo.
>
> The final exported image should be a newly generated composition containing:
>
> 1. User's selected game photo
> 2. PlayPanda logo/branding
> 3. WIN / LOSS / DRAW
> 4. Final score
> 5. Sport/game
> 6. Date and time
> 7. Optional tournament/event
> 8. Engagement statement
> 9. Optional caption
> 10. Hashtags
>
> ## Caption and Hashtags
>
> Include:
>
> **Caption**
>
> Free text written by the user.
>
> Example:
>
> `Great game today!`
>
> **Hashtags**
>
> User can type hashtags manually.
>
> Also suggest relevant hashtags automatically from the match.
>
> Example:
>
> ```text
> #PlayPanda
> #Pickleball
> #GameDay
> #Winning
> #PlayPandaOpen
> ```
>
> Suggested hashtags should remain editable.
>
> ## Share Formats
>
> The user should be able to choose:
>
> ### Instagram / Facebook Story
>
> Portrait format:
>
> `1080 × 1920`
>
> ### Instagram Post
>
> Square format:
>
> `1080 × 1080`
>
> ### Facebook / General Post
>
> Landscape format:
>
> `1200 × 630`
>
> The UI preview must update when the user changes the format.
>
> ## Export
>
> Add:
>
> * `Download PNG`
> * `Share`
>
> Generate the final composition as a PNG.
>
> If the browser/device supports the Web Share API, allow sharing the generated image through the native share menu.
>
> Otherwise provide the PNG download.
>
> Do not attempt to automatically post to Instagram or Facebook without an official supported integration.
>
> ## User Flow
>
> Use this flow:
>
> ```text
> Match Completed
> ↓
> Result Verified
> ↓
> Stats / Match History Updated
> ↓
> Show "Share Your Match"
> ↓
> Open Share Match Builder
> ↓
> Choose Game Photo
> ↓
> Select Story / Square / Landscape
> ↓
> PlayPanda automatically fills match details
> ↓
> User edits caption + hashtags
> ↓
> Preview
> ↓
> Generate PNG
> ↓
> Download / Share
> ```
>
> ## Important Data Rule
>
> Match result information must come from the actual PlayPanda match record.
>
> Do not let the player manually change:
>
> * winner
> * official score
> * opponent
> * game
> * match date
> * official result
>
> Those fields are read-only.
>
> The player may only customize:
>
> * uploaded photo
> * caption
> * hashtags
> * share layout
> * whether optional statistics are visible
>
> This prevents users from creating fake official match cards.
>
> ## Match Verification
>
> If the result is verified, display:
>
> `Verified Match`
>
> If the match is casual but confirmed by both players:
>
> `Confirmed Match`
>
> Never label an unverified result as verified.
>
> ## UI
>
> Follow the existing PlayPanda dark sports design.
>
> Main colors:
>
> ```css
> --background: #080D0B;
> --surface: #14211C;
> --primary: #3FD285;
> --primary-hover: #52E99A;
> --text-primary: #FFFFFF;
> --text-secondary: #A6B0AC;
> --border: #26352F;
> --success: #22C55E;
> --danger: #EF4444;
> --champion: #F4B942;
> ```
>
> The Share Match Builder should feel premium and athletic, not like a generic Canva editor.
>
> Desktop suggestion:
>
> ```text
> ┌──────────────────────────────────────────────┐
> │ Share Your Match                            │
> ├───────────────────┬──────────────────────────┤
> │                   │ Match Details            │
> │                   │ WIN                      │
> │   LIVE PREVIEW    │ 21–18 • 21–15           │
> │                   │ Pickleball Singles       │
> │                   │                          │
> │                   │ Upload Photo             │
> │                   │ Caption                  │
> │                   │ Hashtags                 │
> │                   │ Format                   │
> │                   │                          │
> │                   │ [Generate PNG]           │
> └───────────────────┴──────────────────────────┘
> ```
>
> Mobile:
>
> ```text
> Preview
>
> Match Information
>
> Photo
>
> Caption
>
> Hashtags
>
> Share Format
>
> [ Generate & Share ]
> ```
>
> ## Timeline Integration
>
> Also connect this with the PlayPanda Game Timeline feature.
>
> After creating the card, give the user:
>
> * `Post to PlayPanda Timeline`
> * `Share Outside PlayPanda`
>
> If posted to PlayPanda Timeline, save the timeline post separately from the official Match History.
>
> Important:
>
> **Deleting a social timeline post must never delete the official match result or match history.**
>
> ## Reusable Component Structure
>
> Avoid one giant component.
>
> Create reusable components such as:
>
> ```text
> ShareMatchModal
> ShareMatchBuilder
> MatchSharePreview
> ShareFormatSelector
> MatchStatOverlay
> MatchPhotoUploader
> CaptionEditor
> HashtagEditor
> EngagementMessage
> ExportShareCard
> ```
>
> Keep match data and visual customization separate.
>
> ## Required States
>
> Handle:
>
> * Loading match data
> * No uploaded photo
> * Uploading photo
> * Generating PNG
> * Successful generation
> * Share supported
> * Share unsupported
> * Export failure
> * Match not verified
> * Mobile layout
>
> ## Acceptance Criteria
>
> The feature is complete when:
>
> 1. A player can open a completed match.
> 2. They can choose `Share Match`.
> 3. Real match data appears automatically.
> 4. They can upload an actual game photo.
> 5. They can add caption and hashtags.
> 6. They can choose Story, Square, or Landscape.
> 7. The app generates a branded PlayPanda image.
> 8. The generated PNG contains the correct official score and game details.
> 9. The user can download/share the image.
> 10. The user can optionally publish the same match to their PlayPanda Timeline.
> 11. Match History remains independent from social posts.
> 12. The UI works properly on mobile, tablet, and desktop.
>
> Before making major architectural changes, inspect the current React project and reuse the existing components, styles, logo, mascot, routing, and data patterns wherever possible.

Kana nga prompt maka-explain kang Claude nga dili lang siya maghimo ug static image template. **Actual feature siya sa PlayPanda** nga ang system itself mag-generate ug Strava-style share asset gikan sa real match data.
