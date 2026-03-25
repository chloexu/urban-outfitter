# Urban Outfitter — Frontend Design Specification

**Date:** 2026-03-25
**Platform:** React Native + Expo (iOS + responsive web)
**Derived from:** UI screenshots (5 screens) + backend design spec `2026-03-22-urban-outfitter-design.md`

---

## 1. Design Tokens

### 1.1 Colors

```
Primary / Brand
  --color-primary:          #C26B52   /* terracotta/rust — CTAs, active chips, filled tags */
  --color-primary-light:    #D4856E   /* hover state */
  --color-primary-dark:     #A85A42   /* pressed state */

Backgrounds
  --color-bg:               #F5F0EB   /* warm linen — app background */
  --color-surface:          #EDE9E3   /* card / chat area background */
  --color-surface-input:    #FFFFFF   /* text input fill */

Text
  --color-text-primary:     #1A1714   /* near-black — headings, body */
  --color-text-secondary:   #7A7169   /* muted gray-brown — labels, subtitles, placeholders */
  --color-text-on-primary:  #FFFFFF   /* text on terracotta buttons/chips */

Border / Divider
  --color-border:           #D4CFCA   /* chip outlines, input borders */
  --color-border-selected:  #C26B52   /* active chip ring, selected color circle ring */

Status
  --color-error:            #C0392B
  --color-success:          #4A7C5F
```

Preset color palette (Colors I Love / Colors to Avoid circles):

| Name    | Hex       |
|---------|-----------|
| black   | `#1A1714` |
| tan     | `#C4A76B` |
| cream   | `#EDE9E3` |
| sage    | `#6E8B74` |
| rust    | `#C26B52` |
| navy    | `#1E3354` |

---

### 1.2 Typography

**Font families**
- Serif (hero headings): `Georgia, "Times New Roman", serif`
- Sans-serif (all else): `-apple-system, "SF Pro Display", Helvetica Neue, sans-serif`

**Type scale**

| Token      | Size | Line height | Usage                                   |
|------------|------|-------------|------------------------------------------|
| `text-xs`  | 11px | 16px        | All-caps screen/section labels           |
| `text-sm`  | 13px | 18px        | Secondary body, timestamps               |
| `text-base`| 15px | 22px        | Primary body, chat bubbles               |
| `text-md`  | 17px | 24px        | Chip labels, input text, list items      |
| `text-lg`  | 20px | 28px        | Section titles ("Go-To Brands")          |
| `text-xl`  | 28px | 36px        | Screen titles ("Find Your Next Piece")   |
| `text-2xl` | 36px | 44px        | Hero headline ("Stop browsing.")         |
| `text-3xl` | 44px | 52px        | Hero headline second line                |

**Letter spacing**
- `tracking-caps`: `0.10em` — all-caps section labels
- `tracking-tight`: `-0.01em` — large serif headings

**Font weights:** Regular `400`, Medium `500`, Bold `700`

---

### 1.3 Spacing (8-pt grid)

| Token       | Value |
|-------------|-------|
| `space-1`   | 4px   |
| `space-2`   | 8px   |
| `space-3`   | 12px  |
| `space-4`   | 16px  |
| `space-5`   | 20px  |
| `space-6`   | 24px  |
| `space-8`   | 32px  |
| `space-10`  | 40px  |
| `space-12`  | 48px  |
| `space-16`  | 64px  |

---

### 1.4 Border Radius

| Token         | Value  | Usage                                      |
|---------------|--------|--------------------------------------------|
| `radius-sm`   | 6px    | Budget input fields                        |
| `radius-md`   | 12px   | Cards, chat bubbles, buttons               |
| `radius-lg`   | 20px   | Tab switcher, hero image                   |
| `radius-full` | 9999px | Pill chips, color circles, send button     |

---

### 1.5 Shadows

```
--shadow-card:   0 1px 4px rgba(0,0,0,0.08)
--shadow-modal:  0 8px 32px rgba(0,0,0,0.16)
```

---

## 2. Component Library

### 2.1 PillChip

Three variants:

**Unselected**
- Background: transparent
- Border: `1px solid --color-border`
- Text: `--color-text-primary`, `text-md`, weight 400
- Padding: `8px 16px`, height 36px, `borderRadius: radius-full`

**Selected** (no remove)
- Background: `--color-primary`
- Border: none
- Text: `--color-text-on-primary`, weight 500

**Removable** (profile brand/style tags)
- Background: `--color-primary`
- Border: none
- Text: `--color-text-on-primary`
- Trailing `×` icon: white, 16px, tappable hit area 32×32px
- Padding: `8px 14px 8px 16px`

Chip group: `flexWrap: "wrap"`, gap `8px`

---

### 2.2 ColorCircle

- Size: 36×36px, `borderRadius: radius-full`
- **Unselected:** solid fill color, no border
- **Selected:** `boxShadow: "0 0 0 2px white, 0 0 0 4px --color-primary"` (creates 2px ring gap + 2px terracotta ring)
- **Add (+) circle:** dashed border `1.5px --color-border`, background transparent, `+` icon in `--color-text-secondary`
- Gap between circles: `8px`

---

### 2.3 PrimaryButton

```
background:    --color-primary
text:          --color-text-on-primary, text-md, weight 500
borderRadius:  radius-md (12px)
padding:       16px 24px
height:        52px
width:         auto (inline) or 100% (full-width)
active state:  scale 0.97, background --color-primary-dark
optional icon: trailing "→" or leading save icon
```

---

### 2.4 SecondaryButton

```
background:    transparent
border:        1.5px solid --color-border
text:          --color-text-primary, text-md, weight 400
borderRadius:  radius-md
padding:       16px 24px
height:        52px
active state:  background rgba(0,0,0,0.04)
```

---

### 2.5 TabSwitcher

Used on Shopping Session screen to toggle Chat Mode / Quick Filters.

```
Container:
  background:    --color-surface (or white)
  borderRadius:  radius-md
  border:        1px solid --color-border
  padding:       4px
  flexDirection: row

Each Tab:
  flex:          1
  height:        40px
  borderRadius:  9px
  Inactive:      background transparent, text --color-text-secondary
  Active:        background --color-primary, text --color-text-on-primary

Tab label: leading icon + text, text-base, weight 500
Icons: speech-bubble (Chat Mode), sliders/equalizer (Quick Filters)
```

---

### 2.6 ChatBubble (assistant)

```
background:    --color-surface (#EDE9E3)
borderRadius:  12px 12px 12px 4px   /* bottom-left flat for assistant */
padding:       12px 16px
maxWidth:      85% of container
text:          --color-text-primary, text-base, weight 400
alignment:     left (marginRight: auto)
```

User bubble (future):
```
background:    --color-primary
text:          --color-text-on-primary
borderRadius:  12px 12px 4px 12px   /* bottom-right flat for user */
alignment:     right (marginLeft: auto)
```

---

### 2.7 ChatInput

```
Container:
  flexDirection: row
  alignItems:    center
  borderTop:     1px solid --color-border
  background:    --color-bg
  padding:       12px 16px
  paddingBottom: (safe area inset)

Input field:
  flex:          1
  background:    white
  borderRadius:  radius-full
  border:        1px solid --color-border
  padding:       10px 16px
  placeholder:   "Tell me what you're looking for..."  --color-text-secondary
  fontSize:      text-base
  multiline:     true, maxHeight: 120px

Send button:
  width/height:  44px
  borderRadius:  radius-full
  background:    --color-primary (when input has content) / --color-surface (empty)
  icon:          arrow-right, white, 20px
  marginLeft:    8px
```

---

### 2.8 BudgetInput

```
Container: flexDirection row, alignItems center

"$" prefix label:
  color:      --color-text-secondary
  fontSize:   text-base
  marginRight: 4px

Input field:
  width:        80px (filter mode) / 120px (profile mode)
  height:       44px
  borderRadius: radius-sm
  border:       1px solid --color-border
  background:   white
  text:         --color-text-primary, text-base, textAlign: center

Separator text ("to" in filter mode, "—" in profile mode):
  color:        --color-text-secondary
  marginHorizontal: 8px
```

---

### 2.9 CategoryBudgetCard

Used in Profile to set per-category budget ranges.

```
Container:
  background:    --color-surface
  borderRadius:  radius-md
  padding:       16px
  border:        1px solid --color-border
  marginBottom:  8px

Category label:
  fontSize:      text-md, weight 500
  color:         --color-text-primary
  marginBottom:  12px

Budget row: BudgetInput component (min — max)
```

---

### 2.10 AddTagInput

Used for "Add a brand..." and "Add a style tag..." inputs.

```
Container: flexDirection row, gap 8px

Text input:
  flex:          1
  height:        44px
  borderRadius:  radius-sm
  border:        1px solid --color-border
  background:    white
  padding:       0 12px
  placeholder:   context-specific (e.g., "Add a brand...")

Plus button:
  width/height:  44px
  borderRadius:  radius-sm
  border:        1px solid --color-border
  background:    white
  icon:          "+" --color-text-primary, 20px
```

---

### 2.11 SectionLabel (all-caps)

```
fontSize:       text-xs
fontWeight:     600
color:          --color-text-secondary
letterSpacing:  tracking-caps
textTransform:  uppercase
marginBottom:   12px
```

Used for: "YOUR PERSONAL SHOPPING AI", "SHOPPING SESSION", "STYLE PROFILE", "CATEGORY", "OCCASION", "COLORS", "BUDGET", "STYLE VIBES"

---

### 2.12 SectionTitle

```
fontSize:       text-lg (20px)
fontWeight:     600
color:          --color-text-primary
marginBottom:   12px
fontFamily:     sans-serif
```

Used for: "Go-To Brands", "Budget by Category", "Colors I Love", "Colors to Avoid", "Style Vibes", "Occasion Preferences"

---

## 3. Screen Specifications

### Screen 1 — Home (`app/(tabs)/index.tsx`)

```
Layout:
  ScrollView
  backgroundColor:    --color-bg
  paddingHorizontal:  24px

Header (top of screen, below status bar):
  "Urban Outfitter" wordmark
  fontFamily:   serif, bold
  fontSize:     text-xl (28px), 2 lines stacked
  marginTop:    20px

Hero section (marginTop: 40px):
  SectionLabel: "YOUR PERSONAL SHOPPING AI"

  H1 block (marginTop: 8px, marginBottom: 16px):
    Line 1: "Stop browsing."
    Line 2: "Start finding."
    fontFamily:    serif
    fontSize:      text-2xl (36px) or text-3xl (44px)
    fontWeight:    700
    color:         --color-text-primary
    letterSpacing: tracking-tight
    lineHeight:    52px

  Body text (marginBottom: 32px):
    "Tell us your brands, your palette, your vibe.
     We'll search the stores you love and surface
     only pieces that belong in your wardrobe."
    fontFamily: sans
    fontSize:   text-base (15px)
    color:      --color-text-secondary
    lineHeight: 24px

CTA buttons (gap: 12px):
  PrimaryButton: "Start Shopping →"  (width: 100%, onPress → search tab)
  SecondaryButton: "Set Up Profile"  (width: 100%, onPress → profile tab)

Hero image (marginTop: 24px, marginBottom: 32px):
  width:        100%
  aspectRatio:  0.85  (portrait crop)
  borderRadius: 16px
  resizeMode:   cover
  Source: flat lay of autumn clothing (camel sweater, olive trousers, rust scarf, gold jewelry)
```

---

### Screen 2 — Shopping Session: Chat Mode (`app/(tabs)/search.tsx`)

```
Layout:
  flex: 1
  backgroundColor: --color-bg

Header (paddingHorizontal: 24px, paddingTop: 20px):
  "Urban Outfitter" wordmark (same as home)

Content area (paddingHorizontal: 24px, marginTop: 24px):
  SectionLabel: "SHOPPING SESSION"
  H1: "Find Your Next Piece"
    fontFamily:  sans, fontSize: text-xl, fontWeight: 600
    marginBottom: 16px

  TabSwitcher (marginBottom: 16px):
    Tab 1: Chat Mode (speech-bubble icon) — ACTIVE
    Tab 2: Quick Filters (sliders icon)

Chat container:
  flex:             1
  backgroundColor:  --color-surface
  borderRadius:     16px
  marginHorizontal: 0  (full bleed below header)
  padding:          16px
  overflow:         hidden

  Messages list (FlatList / ScrollView):
    Initial assistant bubble:
      "Hey! Your go-to brands are [brands joined with commas].
       What are you shopping for today?"
    ChatBubble component, marginBottom: auto (sticks to top)

ChatInput (bottom of chat container, above keyboard/safe area)
```

---

### Screen 3 — Shopping Session: Quick Filters Mode (`app/(tabs)/search.tsx`)

Same header + tab switcher as Screen 2, with Quick Filters tab ACTIVE.

```
Filter form (ScrollView, paddingHorizontal: 24px, paddingTop: 16px):

  CATEGORY block (marginBottom: 24px):
    SectionLabel: "CATEGORY"
    PillChip group (single-select):
      Tops | Bottoms | Dresses | Outerwear | Shoes | Accessories

  OCCASION block (marginBottom: 24px):
    SectionLabel: "OCCASION"
    PillChip group (single-select):
      Work | Date Night | Weekend | Travel | Special Event | Workout | Other

  COLORS block (marginBottom: 24px):
    SectionLabel: "COLORS"
    ColorCircle row (multi-select, 6 preset colors):
      black, tan, cream, sage, rust, navy
    Note: selection overrides profile.colors_liked for this session only

  BUDGET block (marginBottom: 24px):
    SectionLabel: "BUDGET"
    BudgetInput: $ [min field] to $ [max field]
    Pre-filled from profile.budget_defaults[selected category]

  STYLE VIBES block (marginBottom: 32px):
    SectionLabel: "STYLE VIBES"
    PillChip group (multi-select):
      Pre-populated from profile.style_tags; user can deselect or add

  CTA (sticky bottom bar or bottom of scroll):
    PrimaryButton: "Start Searching →"  (full width)
    onPress → POST /session with mode: "form", then opens SSE stream
```

---

### Screen 4 — Profile: Your Preferences, Part 1 (`app/(tabs)/profile.tsx`)

```
Layout:
  ScrollView
  backgroundColor: --color-bg
  paddingHorizontal: 24px

Header: "Urban Outfitter" wordmark (paddingTop: 20px)

Section intro (marginTop: 24px, marginBottom: 32px):
  SectionLabel: "STYLE PROFILE"
  Title: "Your Preferences"
    fontFamily: sans, fontSize: text-xl, fontWeight: 600
    marginBottom: 8px
  Subtitle: "The more we know, the better we shop for you."
    fontSize: text-base, color: --color-text-secondary

GO-TO BRANDS (marginBottom: 32px):
  SectionTitle: "Go-To Brands"
  Removable PillChip group (from profile.brands):
    Each chip: brand name + × to remove
    flexWrap: wrap, gap: 8px
    marginBottom: 12px
  AddTagInput (placeholder: "Add a brand...")

BUDGET BY CATEGORY (marginBottom: 32px):
  SectionTitle: "Budget by Category"
  Stack of CategoryBudgetCards, one per category in profile.budget_defaults:
    Pants / Sweaters / Dresses / Accessories / Outerwear / Shoes
    (Rendered dynamically from profile data)
```

---

### Screen 5 — Profile: Your Preferences, Part 2 (`app/(tabs)/profile.tsx`)

Continuation of the same ScrollView from Screen 4.

```
COLORS I LOVE (marginBottom: 24px):
  SectionTitle: "Colors I Love"
  ColorCircle row (from profile.colors_liked):
    One circle per saved color
    Add (+) dashed circle at end → opens color picker or preset selector
  Multi-select toggle

COLORS TO AVOID (marginBottom: 32px):
  SectionTitle: "Colors to Avoid"
  ColorCircle row (from profile.colors_avoided):
    Same pattern as Colors I Love
    Add (+) circle at end
  Note: these always apply regardless of session overrides

STYLE VIBES (marginBottom: 32px):
  SectionTitle: "Style Vibes"
  Removable PillChip group (from profile.style_tags):
    flexWrap: wrap, gap: 8px, marginBottom: 12px
  AddTagInput (placeholder: "Add a style tag...")

OCCASION PREFERENCES (marginBottom: 40px):
  SectionTitle: "Occasion Preferences"
  PillChip group (multi-select toggle, from profile.occasion_prefs):
    Work | Date Night | Weekend | Travel | Special Event | Workout
    Selected = terracotta fill; unselected = outlined

SAVE PROFILE (marginBottom: 40px + safe area):
  PrimaryButton (full width):
    leading icon: save/disk (20px, white)
    label: "Save Profile"
    onPress → PUT /profile with updated profile data
```

---

## 4. Navigation Structure

```
expo-router file-based tab navigator

app/
  (tabs)/
    _layout.tsx     Bottom tab bar configuration
    index.tsx       Home screen
    search.tsx      Shopping Session (Chat + Quick Filter modes + results)
    profile.tsx     Style Profile editor
    history.tsx     Session history list

Bottom tab bar:
  backgroundColor:  white or --color-bg
  borderTop:        1px solid --color-border
  height:           83px (including iOS safe area)
  activeColor:      --color-primary
  inactiveColor:    --color-text-secondary
  iconSize:         24px
  Tabs: Home | Search | Profile | History
```

---

## 5. API Integration Reference

Hooks wiring to backend endpoints:

| Hook             | File                     | Endpoint(s)                                           |
|------------------|--------------------------|-------------------------------------------------------|
| `useProfile`     | `hooks/useProfile.ts`    | `GET /profile`, `PUT /profile`                        |
| `useSession`     | `hooks/useSession.ts`    | `POST /session`, `/session/{id}/resume`, `/session/{id}/close` |
| `useSSE`         | `hooks/useSSE.ts`        | `GET /search/{id}/stream?token={token}`               |

Key behaviors:
- Profile is cached in `AsyncStorage`; synced on mount and after `PUT /profile`
- Quick Filters form pre-fills from `profile.budget_defaults[category]` and `profile.style_tags`
- Chat mode greeting uses `profile.brands` joined with ", " and "&"
- SSE auth: token passed as query param (not Authorization header)

---

## 6. Component → Screen Mapping

| Component          | Home | Session (Chat) | Session (Filter) | Profile |
|--------------------|------|----------------|------------------|---------|
| SectionLabel       | ✓    | ✓              | ✓                | ✓       |
| PillChip           |      |                | ✓                | ✓       |
| ColorCircle        |      |                | ✓                | ✓       |
| PrimaryButton      | ✓    |                | ✓                | ✓       |
| SecondaryButton    | ✓    |                |                  |         |
| TabSwitcher        |      | ✓              | ✓                |         |
| ChatBubble         |      | ✓              |                  |         |
| ChatInput          |      | ✓              |                  |         |
| BudgetInput        |      |                | ✓                | ✓       |
| CategoryBudgetCard |      |                |                  | ✓       |
| AddTagInput        |      |                |                  | ✓       |
| SectionTitle       |      |                |                  | ✓       |
