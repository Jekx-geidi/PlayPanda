Oo, kana gyud angay sa **PlayPanda**. Mao ni ang mahimong social layer niya. Ang vibe kay murag mag-open ka ug player profile sa competitive game, makita nimo iyang performance, history, teams, ug recent activity.

Akong tawag sa feature:

# PlayPanda Player Profile

Every registered user gets a public sports profile.

Example:

```text
┌───────────────────────────────────────────────┐
│  [Avatar]                                     │
│  Riel Jake                                    │
│  @rieljake                                    │
│  Cebu                                         │
│                                               │
│  🏸 Badminton • 🏀 Basketball • 🏓 Table Tennis│
│                                               │
│  124 Followers      89 Following              │
│                                               │
│  [ FOLLOW ]   [ CHALLENGE ]                   │
└───────────────────────────────────────────────┘
```

Then diretso stats.

```text
OVERVIEW

Matches Played       Wins       Losses
     56                38          18

Win Rate
67.9%

Current Streak
🔥 4 Wins

Tournaments
12

Championships
🏆 3
```

Kana ang murag **ML profile stalking feeling**.

## But important: stats should be per sport/game

Dili maayo nga i-combine ang tanan into one meaningless win rate.

Example:

```text
SPORT STATS

🏸 BADMINTON
Matches       24
Wins          18
Losses         6
Win Rate      75%
Current Rank  #8

[ View Stats ]


🏀 BASKETBALL
Matches       19
Wins          11
Losses         8
Win Rate      57.9%
Team          Tech Pandas

[ View Stats ]


🎮 MOBILE LEGENDS
Matches       13
Wins           9
Losses         4
Win Rate      69.2%
Team          Panda Five

[ View Stats ]
```

So mura siya ug game profile where you can inspect the player deeper.

---

# Profile tabs

I would make the profile like this:

**Overview | Matches | Tournaments | Teams | Stats | Achievements**

### Overview

Quick view:

* Wins
* Losses
* Matches
* Win rate
* Current streak
* Sports/Games
* Current teams
* Recent matches
* Achievements

### Matches

Murag match history sa ML:

```text
MATCH HISTORY

WIN
Badminton • Singles
Riel                  21  21
Juan                  17  18
Yesterday
────────────────────────

LOSS
Basketball
Tech Pandas           72
Sports Club           78
Sept 22
────────────────────────

WIN
Table Tennis
Riel                    3
Joshua                  1
Sept 20
```

With filters:

`All | Sports | E-Sports | Wins | Losses`

Then pwede pa nimo i-open ang match.

---

# Match Details

Click one match:

```text
BADMINTON
Men's Singles

FINAL

RIEL
21  21

JUAN
17  18

Winner
Riel

Played
Sept 24 • 3:00 PM

Tournament
PlayPanda Open 2026

Match Type
Official Tournament Match
```

Then makita pud:

**Head-to-Head**

```text
RIEL vs JUAN

Matches     5
Riel Wins   3
Juan Wins   2
```

Kana nice kaayo para sa stalking / rivalry vibe.

---

# Following system

Yes, naa tay:

**Follow**
**Following**
**Followers**

Example:

```text
Riel Jake

124 Followers
89 Following

[ FOLLOW ]
```

When follow nimo ang player, makita nimo iyang sports-related updates.

Not Facebook-style posts.

More like:

```text
ACTIVITY

🏆 Riel finished #1 in
Badminton Men's Singles

🏸 Riel defeated Joshua
21–18, 21–16

👥 Riel joined Tech Pandas

🔥 Riel is now on a
5-match winning streak

🏀 Riel registered for
PlayPanda Basketball Open
```

This is much more aligned with PlayPanda.

---

# Discover Players

Then kinahanglan ta ug page:

## Players

Search:

```text
Search players...
```

Filters:

**Sport**
Badminton

**Skill**
Intermediate

**Status**
Available to Play

Then:

```text
PLAYERS

[Avatar]
Juan Dela Cruz
🏸 Badminton

32 Matches
21 Wins
65.6% Win Rate

[ View Profile ]


[Avatar]
Joshua Lustre
🏸 Badminton

27 Matches
19 Wins
70.3% Win Rate

[ View Profile ]
```

Then you can literally browse/stalk profiles.

---

# Challenge from profile

Kini maoy nice connection.

You visit:

```text
JUAN DELA CRUZ

🏸 Badminton
Intermediate

Matches: 32
Wins: 21
Losses: 11

[ FOLLOW ]
[ CHALLENGE ]
```

Click:

**Challenge**

Then:

```text
CHALLENGE JUAN

Sport
Badminton

Format
Singles

Proposed Date
Saturday

Time
3:00 PM

[ SEND CHALLENGE ]
```

So ang profile is not just for viewing.

It becomes an entry point to **actually play with that person**.

---

# Rivalry / Head-to-Head

I really recommend this feature.

When you view someone you've already played:

```text
YOU vs JUAN

8 Meetings

YOU
5 Wins

JUAN
3 Wins

Last Match
YOU WON

[ REMATCH ]
```

Very game-like.

And that gives PlayPanda personality.

---

# Achievements

Pwede pud:

```text
ACHIEVEMENTS

🏆 Tournament Champion
🔥 10 Win Streak
🎯 First 50 Matches
🥇 Ranked #1
🤝 25 Completed Matches
🏸 Badminton Veteran
```

Not purely decorative.

System generates achievements automatically based on actual activity.

---

# Team Profiles too

Dili players ra.

Teams should also be stalkable.

```text
TECH PANDAS

Basketball

Followers
346

Matches
34

Wins
25

Losses
9

Win Rate
73.5%

🏆 Championships
4

[ FOLLOW TEAM ]
```

Tabs:

**Overview | Roster | Matches | Tournaments | Achievements**

Roster:

```text
CAPTAIN
Riel

PLAYERS
Juan
Joshua
Mark
Kevin
```

---

# Tournament Profile

Same idea can apply to tournaments.

```text
PLAYPANDA OPEN 2026

🏀 Basketball
🏸 Badminton
🎮 Mobile Legends

128 Participants
24 Teams

[ FOLLOW TOURNAMENT ]
```

Following it gives notifications:

* registration opened
* match going live
* leaderboard updated
* finals scheduled
* champion announced

---

# User's own profile

When viewing your own:

```text
MY PROFILE

[ Edit Profile ]

Followers 124
Following 89

Matches 56
Wins 38
Losses 18

[ Share Profile ]
```

And edit:

* Display name
* Username
* Avatar
* Bio
* Preferred sports
* Skill level
* Availability visibility

---

# Public profile URL

Nice pud if every user gets:

```text
playpanda.com/@rieljake
```

or:

```text
playpanda.com/player/rieljake
```

Then shareable siya.

Friends can open it without needing to log in, depending on privacy settings.

---

# But naa tay privacy boundary

Since you said “stalk”, okay ang **sports stalking vibe**, pero dili literal personal tracking.

Public:

* Username
* Avatar
* Sports
* Wins/losses
* Match history
* Teams
* Achievements
* Tournaments
* Followers/following

Do **not** publicly expose:

* Email
* Phone number
* Exact home location
* Private Google account data
* Private availability unless user allows it
* Private messages
* Exact future whereabouts unnecessarily

Example privacy settings:

```text
PROFILE PRIVACY

Profile
○ Public
○ Followers Only

Match History
○ Public
○ Followers Only
○ Private

Following List
○ Public
○ Private

Availability
○ Matchmaking Only
○ Private
```

---

# Stats I'd track

For each player:

**Overall**

* Matches Played
* Wins
* Losses
* Draws
* Win Rate
* Win Streak
* Best Win Streak
* Tournaments Played
* Championships
* Runner-up finishes

Then each sport/game can add its own stats.

Basketball:

```text
Games
Wins
Losses
Points
Average Points
```

Badminton:

```text
Matches
Wins
Losses
Sets Won
Sets Lost
```

MLBB:

```text
Series Played
Series Won
Series Lost
Games Won
Games Lost
```

Dili kinahanglan tanan sports same fields.

---

# The PlayPanda social loop

This is what makes the whole platform connect:

```text
DISCOVER PLAYER
      ↓
VIEW PROFILE
      ↓
FOLLOW
      ↓
SEE MATCH HISTORY
      ↓
CHALLENGE
      ↓
SCHEDULE
      ↓
PLAY
      ↓
RESULT VERIFIED
      ↓
STATS UPDATE
      ↓
PROFILE UPDATE
      ↓
LEADERBOARD UPDATE
      ↓
REMATCH / FOLLOW / RIVALRY
```

Kana ang loop nga makapabalik sa user.

Even after tournament ends, naa gihapon reason nga mag-open sila sa PlayPanda.

---

## Akong proposed main navigation now

With this feature added, Participant navigation becomes:

**Home**
**Discover**
**Matches**
**Tournaments**
**Leaderboard**
**Profile**

Inside **Discover**:

```text
Players
Teams
Open Challenges
Find Match
Find Teammates
Tournaments
```

Mobile bottom nav could be:

**Home | Discover | Play | Matches | Profile**

Then center **Play** button could open:

```text
Find Match
Create Challenge
Find Team
Join Tournament
```

Mao ni akong makita nga strongest direction sa PlayPanda: **tournament platform + matchmaking + competitive sports profile/social network**, instead of tournament management lang.
