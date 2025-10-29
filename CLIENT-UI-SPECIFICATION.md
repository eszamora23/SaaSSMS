# Client UI Specification - Enterprise SaaS Platform
## Material UI Implementation & Responsive Design Guide

### Document Information
- **Version**: 1.0
- **Last Updated**: 2025-10-21
- **Companion Document**: PROJECT.md
- **Target Platforms**: iOS (Safari), Android (Chrome), Tablets, Desktop (Chrome, Firefox, Safari, Edge)
- **Design System**: Material-UI (MUI) v5
- **Responsive Framework**: Mobile-First Design

---

## Table of Contents
1. [Design System Foundation](#design-system-foundation)
2. [Responsive Breakpoints & Layout Strategy](#responsive-breakpoints--layout-strategy)
3. [Theme Configuration](#theme-configuration)
4. [Component Library](#component-library)
5. [Application Shells](#application-shells)
6. [Screen-by-Screen Specifications](#screen-by-screen-specifications)
7. [Mobile-Specific Optimizations](#mobile-specific-optimizations)
8. [Animations & Transitions](#animations--transitions)
9. [Accessibility Standards](#accessibility-standards)
10. [Performance Optimization](#performance-optimization)

---

## Design System Foundation

### Overview
The client UI is built using Material-UI v5 (MUI), Google's Material Design 3 principles, and custom enhancements for a modern, professional SaaS experience. Every interface adapts seamlessly across devices from 320px mobile screens to 4K desktop displays.

### Design Principles

#### 1. Mobile-First Philosophy
- Design and develop for mobile screens first (320px - 768px)
- Progressively enhance for tablets (768px - 1024px)
- Optimize for desktop (1024px+)
- Touch-friendly targets: minimum 44x44px tap areas
- Thumb-zone optimization for bottom navigation on mobile

#### 2. Visual Hierarchy
- **Primary Actions**: Large, prominent buttons with brand colors
- **Secondary Actions**: Outlined or text buttons
- **Tertiary Actions**: Icon buttons or links
- **Information Density**: Sparse on mobile, richer on desktop
- **Z-Index Strategy**: Consistent layering (AppBar: 1100, Drawer: 1200, Modal: 1300, Tooltip: 1500)

#### 3. Consistency Across Platforms
- Same color palette and typography across all devices
- Consistent component behavior (animations, interactions)
- Platform-specific affordances (iOS swipe gestures, Android back button)
- Native-feeling interactions (iOS momentum scrolling, Android ripple effects)

#### 4. Performance-First
- Lazy loading for routes and heavy components
- Virtualized lists for long data sets (messages, appointments)
- Optimized images (WebP, responsive sizes)
- Skeleton loaders for perceived performance
- No layout shifts during load

---

## Responsive Breakpoints & Layout Strategy

### Breakpoint System

Material-UI provides 5 breakpoints, we'll use all strategically:

```javascript
const breakpoints = {
  xs: 0,      // Extra small devices (phones, 320px - 599px)
  sm: 600,    // Small devices (large phones, tablets portrait, 600px - 959px)
  md: 960,    // Medium devices (tablets landscape, small laptops, 960px - 1279px)
  lg: 1280,   // Large devices (laptops, desktops, 1280px - 1919px)
  xl: 1920    // Extra large devices (large desktops, 4K, 1920px+)
};
```

### Layout Patterns by Device

#### Mobile (xs, sm: 320px - 959px)

**Navigation Structure**
- **Bottom Navigation Bar**: Primary navigation with 4-5 icons
  - Home/Dashboard
  - Inbox (Messages)
  - Calendar
  - Customers
  - More (drawer menu)
- **Top App Bar**:
  - Height: 56px
  - Sticky position
  - Elevation: 4 (shadow)
  - Left: Hamburger menu (if needed) or back button
  - Center: Page title (truncated if long)
  - Right: Search icon, notification bell, profile avatar

**Content Area**
- Full-width containers (no max-width constraint)
- Padding: 16px horizontal, 8px vertical
- Single column layouts
- Cards span full width
- Modals/Dialogs: Full-screen or near full-screen
- Forms: Stacked vertically, one field per row

**Interaction Patterns**
- Swipe gestures: Swipe right to go back (iOS), swipe to delete (list items)
- Pull-to-refresh on lists
- Floating Action Button (FAB) for primary actions (bottom-right, 56x56px)
- Bottom sheets for secondary menus/filters
- Tabs: Scrollable horizontal tabs (swipeable)

**Typography**
- H4 for page titles (24px)
- H6 for section headers (18px)
- Body1 for content (16px)
- Body2 for secondary text (14px)
- Caption for meta info (12px)

#### Tablet Portrait (sm, md: 600px - 1279px)

**Navigation Structure**
- **Persistent Side Drawer** (optional on tablet portrait, default on landscape):
  - Width: 240px
  - Variant: `persistent` (can be toggled) or `temporary`
  - Position: Left side
  - Contains full navigation menu with icons + text
- **Top App Bar**:
  - Height: 64px
  - Elevation: 0 (if drawer present) or 2
  - Left: Menu icon (toggles drawer) or breadcrumbs
  - Center: Page title or search bar
  - Right: Notifications, settings, profile

**Content Area**
- Max-width: 1200px (centered)
- Padding: 24px horizontal, 16px vertical
- Two-column layouts where appropriate (e.g., inbox: thread list + message view)
- Cards in grid: 2 columns
- Modals/Dialogs: Centered, max-width 600px
- Forms: 2 columns for related fields (e.g., First Name | Last Name)

**Interaction Patterns**
- Mix of touch and mouse interactions
- Hover states on interactive elements
- Click or tap equally supported
- No bottom navigation (drawer is primary)
- FAB still present for primary actions

**Typography**
- H3 for page titles (32px)
- H5 for section headers (20px)
- Body1 for content (16px)
- Body2 for secondary (14px)

#### Desktop (lg, xl: 1280px+)

**Navigation Structure**
- **Permanent Side Drawer**:
  - Width: 280px (expanded) or 64px (collapsed, icon-only)
  - Variant: `permanent`
  - Toggle button to collapse/expand
  - Smooth width transition (300ms)
- **Top App Bar**:
  - Height: 64px
  - Elevation: 0 (flat, seamless with content)
  - Left: Breadcrumbs or contextual actions
  - Center: Global search bar (prominent, 400px wide)
  - Right: Notifications (with badge), quick actions, profile dropdown

**Content Area**
- Max-width: 1440px (centered with auto margins)
- Padding: 32px horizontal, 24px vertical
- Multi-column layouts (3-column for dashboards, 2-column for detail views)
- Cards in grid: 3-4 columns
- Modals/Dialogs: Centered, max-width 800px for forms, 1200px for content-heavy
- Forms: Multi-column with logical grouping (e.g., Personal Info | Contact Details)

**Interaction Patterns**
- Mouse-first with keyboard navigation
- Rich hover effects (elevation changes, color shifts)
- Right-click context menus
- Keyboard shortcuts (Ctrl+K for search, Esc to close modals)
- Drag-and-drop (calendar appointments, Kanban boards)
- Split-screen views (e.g., customer list + detail panel)

**Typography**
- H2 for page titles (40px)
- H4 for section headers (24px)
- Body1 for content (16px)
- Body2 for secondary (14px)

### Safe Areas & Notches (iOS)

**iPhone Notch & Home Indicator**
- Use `env(safe-area-inset-top)` for status bar notch
- Use `env(safe-area-inset-bottom)` for home indicator (34px on iPhone X+)
- Bottom navigation respects home indicator: `padding-bottom: calc(16px + env(safe-area-inset-bottom))`
- Full-screen modals extend edge-to-edge but content respects safe areas

**Android System Bars**
- Status bar: 24dp (translucent or colored to match app bar)
- Navigation bar: 48dp (on-screen buttons) - content respects this
- Gesture navigation: 16dp bottom inset

---

## Theme Configuration

### Color Palette

#### Primary Colors (Brand Identity)
```javascript
primary: {
  main: '#1976D2',       // Vibrant blue - primary actions, links
  light: '#42A5F5',      // Hover states, backgrounds
  dark: '#1565C0',       // Active states, pressed buttons
  contrastText: '#FFFFFF' // Text on primary color backgrounds
}
```

**Usage**
- Primary buttons (Send SMS, Book Appointment)
- Active navigation items
- Links and interactive text
- Selected states (checkboxes, radio buttons)
- Progress indicators, loading bars

#### Secondary Colors (Accent)
```javascript
secondary: {
  main: '#DC004E',       // Hot pink - secondary actions, highlights
  light: '#F50057',
  dark: '#C51162',
  contrastText: '#FFFFFF'
}
```

**Usage**
- Floating Action Buttons (FAB)
- Accent elements (notification badges)
- Toggle switches (active state)
- Important alerts requiring attention

#### Semantic Colors

**Success**
```javascript
success: {
  main: '#2E7D32',       // Green - success messages, confirmations
  light: '#4CAF50',
  dark: '#1B5E20',
  contrastText: '#FFFFFF'
}
```
- Delivered message status
- Completed appointments
- Success alerts and snackbars
- Positive metrics (e.g., +15% growth)

**Warning**
```javascript
warning: {
  main: '#ED6C02',       // Orange - warnings, pending actions
  light: '#FF9800',
  dark: '#E65100',
  contrastText: '#FFFFFF'
}
```
- Pending appointment confirmations
- Warning alerts
- Attention-required badges
- Upcoming deadlines

**Error**
```javascript
error: {
  main: '#D32F2F',       // Red - errors, destructive actions
  light: '#EF5350',
  dark: '#C62828',
  contrastText: '#FFFFFF'
}
```
- Failed message delivery
- Form validation errors
- Error alerts
- Destructive actions (Delete, Cancel)

**Info**
```javascript
info: {
  main: '#0288D1',       // Light blue - informational messages
  light: '#03A9F4',
  dark: '#01579B',
  contrastText: '#FFFFFF'
}
```
- Info alerts and tooltips
- Neutral status indicators
- Help text

#### Neutral Colors (Backgrounds, Text, Borders)

**Light Mode (Default)**
```javascript
background: {
  default: '#F5F5F5',    // Page background (light gray)
  paper: '#FFFFFF',      // Cards, modals, surfaces
  elevated: '#FFFFFF'    // Elevated elements (with shadow)
}

text: {
  primary: 'rgba(0, 0, 0, 0.87)',      // Primary text (high contrast)
  secondary: 'rgba(0, 0, 0, 0.60)',    // Secondary text (medium contrast)
  disabled: 'rgba(0, 0, 0, 0.38)',     // Disabled text
  hint: 'rgba(0, 0, 0, 0.38)'          // Placeholder text
}

divider: 'rgba(0, 0, 0, 0.12)'         // Borders, dividers
```

**Dark Mode** (Optional, per organization settings)
```javascript
background: {
  default: '#121212',    // Dark background
  paper: '#1E1E1E',      // Cards, modals
  elevated: '#2C2C2C'    // Elevated surfaces
}

text: {
  primary: 'rgba(255, 255, 255, 0.87)',
  secondary: 'rgba(255, 255, 255, 0.60)',
  disabled: 'rgba(255, 255, 255, 0.38)',
  hint: 'rgba(255, 255, 255, 0.38)'
}

divider: 'rgba(255, 255, 255, 0.12)'
```

### Typography System

#### Font Family
```javascript
fontFamily: [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"'
].join(',')
```

**Why**: System fonts provide native feel, best performance, and excellent readability across all platforms.

#### Type Scale

```javascript
typography: {
  h1: {
    fontSize: '2.5rem',      // 40px
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em'
  },
  h2: {
    fontSize: '2rem',        // 32px
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em'
  },
  h3: {
    fontSize: '1.75rem',     // 28px
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '0em'
  },
  h4: {
    fontSize: '1.5rem',      // 24px
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.00735em'
  },
  h5: {
    fontSize: '1.25rem',     // 20px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em'
  },
  h6: {
    fontSize: '1.125rem',    // 18px
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.0075em'
  },
  body1: {
    fontSize: '1rem',        // 16px (base)
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em'
  },
  body2: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em'
  },
  button: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase'
  },
  caption: {
    fontSize: '0.75rem',     // 12px
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em'
  },
  overline: {
    fontSize: '0.625rem',    // 10px
    fontWeight: 600,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase'
  }
}
```

**Responsive Typography** (automatically scales down on mobile)
```javascript
// Mobile adjustments
'@media (max-width:600px)': {
  h1: { fontSize: '2rem' },      // 32px
  h2: { fontSize: '1.75rem' },   // 28px
  h3: { fontSize: '1.5rem' },    // 24px
  h4: { fontSize: '1.25rem' },   // 20px
}
```

### Spacing System

Material-UI's 8px grid system:

```javascript
spacing: 8  // Base unit = 8px

// Usage in components:
padding: theme.spacing(2)        // 16px
margin: theme.spacing(0, 2)      // 0 top/bottom, 16px left/right
gap: theme.spacing(3)            // 24px
```

**Common Spacing Values**
- `spacing(0.5)` = 4px (tight spacing, icon margins)
- `spacing(1)` = 8px (compact spacing, small gaps)
- `spacing(2)` = 16px (default component padding)
- `spacing(3)` = 24px (section spacing)
- `spacing(4)` = 32px (large gaps)
- `spacing(6)` = 48px (page section dividers)
- `spacing(8)` = 64px (hero sections)

### Elevation (Shadows)

Material-UI provides 25 elevation levels (0-24). We use strategically:

- **elevation={0}**: Flat elements (breadcrumbs, flat buttons)
- **elevation={1}**: Cards at rest (1dp shadow)
- **elevation={2}**: App bar, resting buttons
- **elevation={4}**: Navigation drawer, hovering cards
- **elevation={8}**: Dropdown menus, date pickers
- **elevation={16}**: Modals, dialogs
- **elevation={24}**: Full-screen dialogs

**Interactive Elevation**
```javascript
// Card with hover effect
<Card
  elevation={1}
  sx={{
    transition: 'elevation 0.3s',
    '&:hover': { elevation: 4 }
  }}
/>
```

### Border Radius

```javascript
shape: {
  borderRadius: 8  // 8px rounded corners (moderate, modern)
}
```

**Variations**
- Small components (chips, badges): 4px
- Default (buttons, inputs, cards): 8px
- Large components (modals, drawers): 12px
- Circular (avatars, FAB): 50% or 9999px

---

## Component Library

### Detailed Component Specifications

#### 1. Buttons

**Primary Button**
```javascript
<Button
  variant="contained"
  color="primary"
  size="large"
  fullWidth={isMobile}
  startIcon={<SendIcon />}
  sx={{
    height: { xs: 48, sm: 42, md: 40 },  // Larger on mobile for touch
    fontSize: { xs: '1rem', md: '0.875rem' },
    borderRadius: 2,
    boxShadow: 2,
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)',
      transition: 'all 0.2s'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 1
    }
  }}
>
  Send Message
</Button>
```

**Visual Specs**
- **Mobile (xs-sm)**:
  - Height: 48px (minimum touch target)
  - Full-width by default
  - 16px horizontal padding
  - Bold text (600 weight)
  - Ripple effect on tap (Material-UI default)

- **Tablet (md)**:
  - Height: 42px
  - Width: auto (min-width 120px)
  - 24px horizontal padding

- **Desktop (lg+)**:
  - Height: 40px
  - Hover: Elevation increases, subtle lift
  - Cursor: pointer
  - Focus: 2px outline with primary color

**States**
- Default: Solid primary color, elevation 2
- Hover (desktop): Lighter shade, elevation 4, 2px lift
- Active/Pressed: Darker shade, elevation 1, return to position
- Disabled: Gray (#E0E0E0), text color rgba(0,0,0,0.26), no elevation, cursor not-allowed
- Loading: Show circular progress, disable interaction

**Secondary Button**
```javascript
<Button
  variant="outlined"
  color="primary"
  startIcon={<CancelIcon />}
>
  Cancel
</Button>
```

**Visual Specs**
- 2px border in primary color
- Transparent background
- Primary color text
- Hover: Light primary background (alpha 0.08)
- Same height/padding rules as primary button

**Text Button** (Tertiary)
```javascript
<Button variant="text" color="primary">
  Learn More
</Button>
```

**Visual Specs**
- No border, no background
- Primary color text
- Hover: Background primary with alpha 0.04
- Lower visual weight, for less important actions

**Icon Button**
```javascript
<IconButton
  color="primary"
  size="large"
  sx={{
    width: { xs: 48, md: 40 },
    height: { xs: 48, md: 40 }
  }}
>
  <MoreVertIcon />
</IconButton>
```

**Visual Specs**
- Mobile: 48x48px (large touch target)
- Desktop: 40x40px
- Circular ripple on tap/click
- Hover: Circular background (alpha 0.08)
- Padding: 8px (icon itself is 24x24px)

**Floating Action Button (FAB)**
```javascript
<Fab
  color="secondary"
  size="large"
  sx={{
    position: 'fixed',
    bottom: { xs: 80, md: 24 },  // Above bottom nav on mobile
    right: { xs: 16, md: 24 },
    zIndex: 1200
  }}
>
  <AddIcon />
</Fab>
```

**Visual Specs**
- Size: 56x56px (large), 40x40px (small)
- Position: Fixed bottom-right
- Elevation: 6 at rest, 12 on hover
- Shadow: Prominent shadow for prominence
- Animation: Scale up slightly on hover (1.05x)
- Mobile: Bottom 80px to clear bottom navigation

#### 2. Text Fields (Inputs)

**Standard Text Field**
```javascript
<TextField
  label="Customer Name"
  variant="outlined"
  fullWidth
  required
  helperText="Enter customer's full name"
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <PersonIcon />
      </InputAdornment>
    )
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'background.paper',
      '&.Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: 'primary.main'
        }
      }
    }
  }}
/>
```

**Visual Specs**

**Mobile (xs-sm)**
- Height: 56px (default MUI, ample touch target)
- Label: Floats above on focus (default behavior)
- Full-width: Spans container
- Font-size: 16px (prevents iOS zoom on focus)
- Border: 1px solid rgba(0,0,0,0.23)
- Focus: 2px solid primary color, label moves up and shrinks
- Error: Border turns red, helper text shows error message in red

**Desktop (md+)**
- Height: 48px (slightly more compact)
- Hover: Border color darkens slightly
- Focus: Same as mobile

**States**
- Default: Light gray border, placeholder text
- Hover: Border color darkens (rgba(0,0,0,0.87))
- Focus: Primary color border (2px), label animates up
- Filled: Border returns to default, label stays up
- Error: Red border, red helper text, error icon
- Disabled: Light gray background, grayed text, no interaction

**Variants**
- **Outlined** (default): Border all around
- **Filled**: Background fill, bottom border only
- **Standard**: Bottom border only (minimal)

**Input Types**
- Text, Email, Phone, Password (with show/hide toggle)
- Number (with + - spinners on desktop)
- Date, Time (native pickers or custom MUI DatePicker)
- Multiline/Textarea (auto-growing or fixed height)

**Phone Number Input** (Special)
```javascript
<TextField
  label="Phone Number"
  variant="outlined"
  fullWidth
  type="tel"
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <CountrySelect value={country} onChange={setCountry} />
        +1
      </InputAdornment>
    )
  }}
  inputProps={{
    pattern: '[0-9]{10}',
    inputMode: 'tel'  // Shows numeric keyboard on mobile
  }}
/>
```

**Mobile Keyboard**
- `type="tel"` → numeric keyboard with symbols
- `inputMode="numeric"` → pure numeric keyboard
- `type="email"` → keyboard with @ and .
- `type="url"` → keyboard with .com

#### 3. Select / Dropdown

**Select Component**
```javascript
<FormControl fullWidth>
  <InputLabel id="service-select-label">Select Service</InputLabel>
  <Select
    labelId="service-select-label"
    value={service}
    label="Select Service"
    onChange={handleChange}
    MenuProps={{
      PaperProps: {
        style: {
          maxHeight: 300,
          borderRadius: 8
        }
      }
    }}
  >
    <MenuItem value={1}>30-Minute Consultation</MenuItem>
    <MenuItem value={2}>1-Hour Session</MenuItem>
    <MenuItem value={3}>Follow-up Appointment</MenuItem>
  </Select>
</FormControl>
```

**Visual Specs**

**Mobile**
- Height: 56px (matches TextField)
- Tap: Opens native select picker (iOS wheel, Android dropdown) OR custom dropdown
- Dropdown: Full-screen bottom sheet (Material-UI can render as modal on mobile)
- Options: Large touch targets (48px height each)
- Search: For long lists, add search bar at top of dropdown

**Desktop**
- Dropdown: Anchored to select, max-height 300px, scrollable
- Hover: Options highlight on hover
- Keyboard: Arrow keys navigate, Enter selects, Esc closes

**Autocomplete** (For searchable dropdowns)
```javascript
<Autocomplete
  options={customers}
  getOptionLabel={(option) => option.name}
  renderInput={(params) => (
    <TextField {...params} label="Search Customers" variant="outlined" />
  )}
  renderOption={(props, option) => (
    <Box component="li" {...props}>
      <Avatar src={option.avatar} sx={{ mr: 2 }} />
      <Box>
        <Typography variant="body1">{option.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {option.phone}
        </Typography>
      </Box>
    </Box>
  )}
/>
```

**Visual Specs**
- Input with dropdown icon
- Type to filter options in real-time
- Options: Rich content (avatar, name, subtitle)
- Keyboard navigation: Full support
- Clear button (X) to reset selection

#### 4. Cards

**Standard Card**
```javascript
<Card
  elevation={1}
  sx={{
    borderRadius: 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      elevation: 4,
      transform: 'translateY(-4px)'
    }
  }}
>
  <CardMedia
    component="img"
    height="140"
    image="/service-image.jpg"
    alt="Service"
  />
  <CardContent>
    <Typography variant="h6" gutterBottom>
      30-Minute Consultation
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Quick consultation for urgent matters. Book now and get seen today.
    </Typography>
  </CardContent>
  <CardActions>
    <Button size="small" color="primary">Learn More</Button>
    <Button size="small" variant="contained" color="primary">
      Book Now
    </Button>
  </CardActions>
</Card>
```

**Visual Specs**

**Mobile**
- Full-width or grid (1 column)
- Minimum height: 200px
- Padding: 16px
- Border-radius: 8px
- Shadow: Elevation 1 (subtle)

**Tablet**
- Grid: 2 columns (for lists of cards)
- Gap: 16px between cards

**Desktop**
- Grid: 3-4 columns
- Gap: 24px
- Hover: Elevation increases to 4, slight lift (4px)
- Cursor: pointer (if clickable)

**Card Variants**

**Outlined Card** (Alternative to elevation)
```javascript
<Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
```
- 1px border instead of shadow
- Cleaner, flatter look

**Interactive Card** (Clickable)
```javascript
<Card
  component="button"
  onClick={handleClick}
  sx={{
    cursor: 'pointer',
    textAlign: 'left',
    border: 'none',
    '&:active': {
      transform: 'scale(0.98)'
    }
  }}
>
```

#### 5. Lists

**Basic List**
```javascript
<List>
  <ListItem
    button
    onClick={handleClick}
    secondaryAction={
      <IconButton edge="end">
        <ChevronRightIcon />
      </IconButton>
    }
  >
    <ListItemAvatar>
      <Avatar src={customer.avatar} />
    </ListItemAvatar>
    <ListItemText
      primary="John Doe"
      secondary="Last message: 2 hours ago"
    />
  </ListItem>
  <Divider variant="inset" component="li" />
  {/* More items... */}
</List>
```

**Visual Specs**

**Mobile**
- Item height: 64px (with avatar), 48px (text only)
- Ripple effect on tap
- Swipe gestures: Swipe left to reveal actions (Delete, Archive)
  ```javascript
  <SwipeableListItem
    onSwipeLeft={() => showActions()}
    actions={[
      { icon: <DeleteIcon />, color: 'error', onClick: handleDelete },
      { icon: <ArchiveIcon />, color: 'primary', onClick: handleArchive }
    ]}
  >
  ```
- Pull-to-refresh on scrollable lists

**Desktop**
- Hover: Background color changes (primary with alpha 0.04)
- Cursor: pointer
- Keyboard: Arrow keys navigate, Enter selects

**Virtualized List** (For thousands of items)
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={64}
  width="100%"
>
  {({ index, style }) => (
    <ListItem style={style}>
      {/* Item content */}
    </ListItem>
  )}
</FixedSizeList>
```
- Only renders visible items
- Smooth scrolling with thousands of messages/customers

#### 6. Dialogs / Modals

**Standard Dialog**
```javascript
<Dialog
  open={open}
  onClose={handleClose}
  fullScreen={isMobile}  // Full-screen on mobile
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: { xs: 0, sm: 2 },
      m: { xs: 0, sm: 2 }
    }
  }}
>
  <DialogTitle>
    Confirm Appointment
    <IconButton
      onClick={handleClose}
      sx={{ position: 'absolute', right: 8, top: 8 }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers>
    <Typography>
      Are you sure you want to book this appointment?
    </Typography>
    {/* Form fields... */}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleConfirm}>
      Confirm
    </Button>
  </DialogActions>
</Dialog>
```

**Visual Specs**

**Mobile (fullScreen={true})**
- Full-screen takeover (100vw x 100vh)
- Slide up animation from bottom
- Close button: Top-left (X) or top-right
- Content: Scrollable if exceeds viewport
- Actions: Sticky footer with buttons

**Tablet/Desktop**
- Centered on screen
- Max-width: sm (600px), md (960px), lg (1280px)
- Backdrop: Dark overlay (rgba(0,0,0,0.5))
- Close: Click backdrop or Esc key or X button
- Animation: Fade + scale (0.9 to 1)
- Elevation: 24 (highest)

**Dialog Sizes**
- `maxWidth="xs"` (444px): Small confirmations
- `maxWidth="sm"` (600px): Forms, medium content
- `maxWidth="md"` (960px): Large forms, tables
- `maxWidth="lg"` (1280px): Rich content, galleries

**Bottom Sheet** (Mobile Alternative)
```javascript
<SwipeableDrawer
  anchor="bottom"
  open={open}
  onClose={handleClose}
  onOpen={handleOpen}
  disableSwipeToOpen={false}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '90vh'
    }
  }}
>
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
    <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 1, mx: 'auto', mb: 2 }} />
    <Typography variant="h6">Filter Options</Typography>
  </Box>
  {/* Content */}
</SwipeableDrawer>
```

**Visual Specs**
- Slides up from bottom
- Rounded top corners (16px)
- Drag handle (gray bar) for swipe-to-dismiss
- Swipe down to close
- Max-height: 90vh (allows backdrop visibility)

#### 7. Snackbar / Toast Notifications

**Snackbar**
```javascript
<Snackbar
  open={open}
  autoHideDuration={6000}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  sx={{
    bottom: { xs: 80, sm: 24 }  // Above bottom nav on mobile
  }}
>
  <Alert
    onClose={handleClose}
    severity="success"
    variant="filled"
    sx={{ width: '100%' }}
  >
    Message sent successfully!
  </Alert>
</Snackbar>
```

**Visual Specs**

**Mobile**
- Position: Bottom-center, 80px from bottom (above bottom nav)
- Width: ~90% of screen width (with 16px margins)
- Height: Auto (min 48px)
- Duration: 4-6 seconds (short messages), 8-10 seconds (long)
- Animation: Slide up from bottom

**Desktop**
- Position: Bottom-left or top-right (configurable)
- Width: 344px (fixed)
- Animation: Slide in from anchor direction

**Severity Variants**
- **Success**: Green background, checkmark icon
- **Error**: Red background, error icon
- **Warning**: Orange background, warning icon
- **Info**: Blue background, info icon

**Action Button**
```javascript
<Snackbar
  action={
    <Button color="inherit" size="small" onClick={handleUndo}>
      UNDO
    </Button>
  }
>
```
- Optional action (Undo, Retry, View)
- Positioned right of message

#### 8. Navigation Components

**App Bar / Header**
```javascript
<AppBar
  position="sticky"
  elevation={0}
  sx={{
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    color: 'text.primary'
  }}
>
  <Toolbar sx={{ justifyContent: 'space-between' }}>
    {/* Left */}
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton edge="start" onClick={handleMenuToggle}>
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" sx={{ ml: 2, display: { xs: 'none', sm: 'block' } }}>
        Messages
      </Typography>
    </Box>

    {/* Center (Desktop only) */}
    <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, mx: 4 }}>
      <SearchBar />
    </Box>

    {/* Right */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton>
        <Badge badgeContent={4} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
    </Box>
  </Toolbar>
</AppBar>
```

**Visual Specs**

**Mobile**
- Height: 56px
- Position: Sticky (stays at top when scrolling)
- Background: White (light mode) or dark (dark mode)
- Elevation: 0 (flat) with bottom border instead
- Title: Centered or left-aligned
- Icons: Left (menu/back), Right (search, notifications, profile)

**Desktop**
- Height: 64px
- Title: Left with logo
- Search bar: Center (prominent, 400px wide)
- Icons: Right side with spacing

**Bottom Navigation** (Mobile Only)
```javascript
<BottomNavigation
  value={activeTab}
  onChange={handleChange}
  showLabels
  sx={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    borderTop: 1,
    borderColor: 'divider',
    pb: 'env(safe-area-inset-bottom)',  // iOS home indicator
    zIndex: 1100
  }}
>
  <BottomNavigationAction
    label="Home"
    icon={<HomeIcon />}
    value="home"
  />
  <BottomNavigationAction
    label="Inbox"
    icon={<Badge badgeContent={12} color="error"><InboxIcon /></Badge>}
    value="inbox"
  />
  <BottomNavigationAction
    label="Calendar"
    icon={<CalendarIcon />}
    value="calendar"
  />
  <BottomNavigationAction
    label="Customers"
    icon={<PeopleIcon />}
    value="customers"
  />
  <BottomNavigationAction
    label="More"
    icon={<MoreHorizIcon />}
    value="more"
  />
</BottomNavigation>
```

**Visual Specs**
- Height: 56px + safe-area-inset-bottom
- Position: Fixed at bottom
- Items: 4-5 max (iOS guidelines)
- Active: Primary color icon + label
- Inactive: Gray icon + label
- Labels: Optional (can hide on small screens to save space)
- Safe Area: Respects iOS home indicator

**Side Drawer / Navigation Drawer**
```javascript
<Drawer
  variant={isDesktop ? 'permanent' : 'temporary'}
  open={open}
  onClose={handleClose}
  sx={{
    width: 280,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: 280,
      boxSizing: 'border-box',
      borderRight: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }
  }}
>
  <Toolbar /> {/* Spacer for app bar */}
  <Box sx={{ overflow: 'auto', px: 2, py: 2 }}>
    <List>
      <ListItem button selected={active === 'dashboard'}>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem button selected={active === 'inbox'}>
        <ListItemIcon>
          <Badge badgeContent={12} color="error">
            <InboxIcon />
          </Badge>
        </ListItemIcon>
        <ListItemText primary="Inbox" />
      </ListItem>
      {/* More items... */}
    </List>

    <Divider sx={{ my: 2 }} />

    <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
      Quick Actions
    </Typography>
    <List dense>
      <ListItem button>
        <ListItemIcon><SendIcon /></ListItemIcon>
        <ListItemText primary="New Message" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><AddIcon /></ListItemIcon>
        <ListItemText primary="New Appointment" />
      </ListItem>
    </List>
  </Box>
</Drawer>
```

**Visual Specs**

**Mobile (temporary variant)**
- Width: 280px (slides over content)
- Backdrop: Dark overlay
- Animation: Slide in from left
- Close: Swipe left, click backdrop, or close button

**Desktop (permanent variant)**
- Width: 280px (always visible)
- Pushes content to the right
- Can collapse to 64px (icon-only mode)
- Transition: Smooth width animation (300ms)

**Collapsed State** (Desktop)
```javascript
<Drawer sx={{ width: collapsed ? 64 : 280 }}>
  {/* Show only icons, hide text when collapsed */}
</Drawer>
```
- Width: 64px
- Shows only icons (24px + 20px padding each side)
- Tooltip on hover to show label
- Toggle button to expand/collapse

#### 9. Tabs

**Horizontal Tabs**
```javascript
<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
  <Tabs
    value={activeTab}
    onChange={handleChange}
    variant="scrollable"
    scrollButtons="auto"
    allowScrollButtonsMobile
  >
    <Tab label="Overview" value="overview" />
    <Tab label="Messages" value="messages" icon={<Badge badgeContent={5} color="error" />} />
    <Tab label="Appointments" value="appointments" />
    <Tab label="Notes" value="notes" />
  </Tabs>
</Box>
<TabPanel value={activeTab} index="overview">
  {/* Content */}
</TabPanel>
```

**Visual Specs**

**Mobile**
- Variant: `scrollable` (horizontal scroll if too many tabs)
- Swipeable: Use `react-swipeable-views` to swipe between tabs
- Indicator: Underline in primary color (2px thick)
- Tab height: 48px
- Tab min-width: 90px, max-width: 360px

**Desktop**
- Variant: `standard` (fit all tabs) or `scrollable` if many
- Hover: Background highlight
- Indicator: Animated slide to active tab

**Vertical Tabs** (Desktop Sidebar Style)
```javascript
<Box sx={{ display: 'flex' }}>
  <Tabs
    orientation="vertical"
    value={activeTab}
    sx={{ borderRight: 1, borderColor: 'divider', width: 200 }}
  >
    <Tab label="Profile" value="profile" />
    <Tab label="Security" value="security" />
    <Tab label="Notifications" value="notifications" />
  </Tabs>
  <Box sx={{ flex: 1, p: 3 }}>
    <TabPanel value={activeTab} index="profile">
      {/* Content */}
    </TabPanel>
  </Box>
</Box>
```

#### 10. Data Tables

**Responsive Table**
```javascript
<TableContainer component={Paper} sx={{ borderRadius: 2 }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Customer</TableCell>
        <TableCell>Phone</TableCell>
        <TableCell>Last Contact</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {customers.map((customer) => (
        <TableRow
          key={customer.id}
          hover
          sx={{ cursor: 'pointer' }}
          onClick={() => handleRowClick(customer.id)}
        >
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={customer.avatar} sx={{ mr: 2 }} />
              <Typography variant="body2">{customer.name}</Typography>
            </Box>
          </TableCell>
          <TableCell>{customer.phone}</TableCell>
          <TableCell>{formatDate(customer.lastContact)}</TableCell>
          <TableCell align="right">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

**Visual Specs**

**Mobile - Card View** (Not a table)
```javascript
// Tables don't work well on mobile, use cards instead
<Stack spacing={2}>
  {customers.map(customer => (
    <Card key={customer.id}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={customer.avatar} sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {customer.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.phone}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Last contact: {formatDate(customer.lastContact)}
        </Typography>
      </CardContent>
    </Card>
  ))}
</Stack>
```

**Desktop - Full Table**
- Sticky header (on scroll)
- Hover: Row background highlight
- Sorting: Click column header to sort (with arrow indicator)
- Pagination: Bottom (Material-UI TablePagination)
- Selection: Checkbox column (for bulk actions)
- Fixed layout for consistent column widths

**Table Features**

**Sorting**
```javascript
const [order, setOrder] = useState('asc');
const [orderBy, setOrderBy] = useState('name');

<TableCell sortDirection={orderBy === 'name' ? order : false}>
  <TableSortLabel
    active={orderBy === 'name'}
    direction={orderBy === 'name' ? order : 'asc'}
    onClick={() => handleSort('name')}
  >
    Name
  </TableSortLabel>
</TableCell>
```

**Pagination**
```javascript
<TablePagination
  component="div"
  count={totalRows}
  page={page}
  onPageChange={handlePageChange}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={handleRowsPerPageChange}
  rowsPerPageOptions={[10, 25, 50, 100]}
/>
```

**Selection (Bulk Actions)**
```javascript
<TableCell padding="checkbox">
  <Checkbox
    checked={selected.includes(row.id)}
    onChange={() => handleSelect(row.id)}
  />
</TableCell>
```

---

## Application Shells

### Overview
The application has three main shells, each optimized for its audience:

1. **Public Booking Portal** - Customer-facing, no auth required
2. **Worker Console** - Worker dashboard with SMS inbox, calendar, customers
3. **Admin Dashboard** - Organization admin with full management capabilities

---

### 1. Public Booking Portal Shell

**Purpose**: Customer-facing appointment booking (Calendly-like experience)

**URL Structure**: `https://{orgSlug}.domain.com/`

#### Layout Structure

**Mobile Layout**
```
┌─────────────────────────────────────┐
│  [Logo]  OrgName         [Language] │ <- AppBar (56px)
├─────────────────────────────────────┤
│                                     │
│  Hero Section                       │
│  "Book Your Appointment"            │
│  [Get Started Button]               │
│                                     │
├─────────────────────────────────────┤
│  Services (Vertical Cards)          │
│  ┌─────────────────────────────┐   │
│  │ [Image]                     │   │
│  │ 30-Min Consultation         │   │
│  │ $50 • 30 minutes            │   │
│  │ [Book Now]                  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [Image]                     │   │
│  │ 1-Hour Session              │   │
│  │ ...                         │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Footer                             │
│  About • Contact • Privacy          │
└─────────────────────────────────────┘
```

**Desktop Layout**
```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo] OrgName          Home Services About    [Book Now] [Lang]│ <- AppBar (64px)
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│         Hero Section (Full-width, centered)                      │
│         "Book Your Appointment Online"                           │
│         "Fast, easy, and convenient"                             │
│         [Get Started]                                            │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Services (Grid: 3 columns)                                     │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│   │  [Image]   │  │  [Image]   │  │  [Image]   │              │
│   │  30-Min    │  │  1-Hour    │  │  Follow-up │              │
│   │  $50 • 30m │  │  $90 • 60m │  │  $30 • 15m │              │
│   │ [Book Now] │  │ [Book Now] │  │ [Book Now] │              │
│   └────────────┘  └────────────┘  └────────────┘              │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  Footer (Multi-column)                                           │
│  About | Services | Contact | Privacy | Terms                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Booking Flow Screens

**Screen 1: Service Selection**

**Mobile**
```
┌─────────────────────────────────────┐
│ [←]  Select a Service               │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ┌─────┐                         ││
│ │ │Image│ 30-Minute Consultation  ││
│ │ └─────┘ Quick session for...    ││
│ │         30 min • $50            ││
│ │         ✓ Available today       ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ┌─────┐                         ││
│ │ │Image│ 1-Hour Session          ││
│ │ └─────┘ Comprehensive...        ││
│ │         60 min • $90            ││
│ │         ✓ Available this week   ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**
- Each service card: Full-width, 120px height
- Left: Service image (80x80px, rounded)
- Right: Service details
  - Name (Body1, bold)
  - Description (Body2, gray, 2 lines max with ellipsis)
  - Duration & Price (Caption, primary color)
  - Availability indicator (Caption with checkmark icon)
- Tap card → proceeds to worker selection
- Active card: Border in primary color

**Desktop**
- 3-column grid
- Cards: 280px width, 320px height
- Hover: Elevation increase, "Book Now" button appears
- Image: 100% width, 180px height
- More space for description (4 lines)

**Screen 2: Worker Selection (Optional)**

**Mobile**
```
┌─────────────────────────────────────┐
│ [←]  Select Provider                │
├─────────────────────────────────────┤
│ Service: 30-Minute Consultation     │
│ Duration: 30 minutes                │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Dr. Jane Smith         ││
│ │          ⭐ 4.9 (124 reviews)   ││
│ │          Next available:        ││
│ │          Today at 2:00 PM       ││
│ │          [Select]               ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Dr. John Doe           ││
│ │          ⭐ 5.0 (89 reviews)    ││
│ │          Next available:        ││
│ │          Tomorrow at 10:00 AM   ││
│ │          [Select]               ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 👥 First Available              ││
│ │    Book with the next available ││
│ │    provider for fastest booking ││
│ │    [Select]                     ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**
- Worker cards: Full-width, 100px height
- Left: Avatar (64x64px, circular)
- Right: Worker info
  - Name (Body1, bold)
  - Rating (Caption with star icon, gold color)
  - Next availability (Caption, primary color)
- "First Available" option: Highlighted with icon
- Tap "Select" → proceeds to date/time picker

**Desktop**
- 2-column grid
- Cards: Larger (200px height)
- Worker photos: 120x120px
- Bio excerpt shown (3 lines)
- Hover: Border highlight

**Screen 3: Date & Time Selection**

**Mobile**
```
┌─────────────────────────────────────┐
│ [←]  Select Date & Time             │
├─────────────────────────────────────┤
│ Service: 30-Min Consultation        │
│ Provider: Dr. Jane Smith            │
├─────────────────────────────────────┤
│                                     │
│ 📅 Select Date                      │
│ ┌─────────────────────────────────┐│
│ │    November 2025                ││
│ │ Su Mo Tu We Th Fr Sa            ││
│ │           1  2  3  4            ││
│ │  5  6  7  8  9 10 11            ││
│ │ 12 13 14 15 16 17 18            ││
│ │ 19 20 [21] 22 23 24 25          ││ <- Today highlighted
│ │ 26 27 28 29 30                  ││
│ └─────────────────────────────────┘│
│                                     │
│ 🕐 Available Times                  │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │ 9:00 AM│ │10:00 AM│ │11:00 AM│  │
│ └────────┘ └────────┘ └────────┘  │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │ 1:00 PM│ │ 2:00 PM│ │ 3:00 PM│  │ <- 2:00 PM selected
│ └────────┘ └────────┘ └────────┘  │
│ ┌────────┐                         │
│ │ 4:00 PM│                         │
│ └────────┘                         │
│                                     │
│ Timezone: EST (GMT-5)               │
│ [Change Timezone]                   │
│                                     │
│ [Continue] ────────────────────────►│
└─────────────────────────────────────┘
```

**Visual Details**

**Calendar Component**
- Full-width, month view
- Days: 40x40px tap targets
- Today: Border in primary color
- Available days: Default text color
- Unavailable days: Grayed out, not tappable
- Selected day: Filled circle, primary color background
- Animation: Fade in when switching months
- Navigation: < > arrows to change month

**Time Slot Grid**
- Chips layout (wrapping, 3 per row on mobile)
- Each slot: 100px width, 48px height
- Border: 1px solid gray
- Selected: Filled with primary color, white text
- Unavailable: Grayed out with strikethrough (or not shown)
- Tap slot → selection moves with animation

**Timezone**
- Detected automatically from browser
- Link to change: Opens timezone picker dialog
- Display: Abbreviation + GMT offset

**Continue Button**
- Fixed at bottom (above safe area)
- Full-width with horizontal padding
- Large (56px height)
- Disabled until date AND time selected

**Desktop**
```
┌───────────────────────────────────────────────────────────┐
│ [←]  Select Date & Time                                   │
├───────────────────────────────────────────────────────────┤
│ Service: 30-Min Consultation | Provider: Dr. Jane Smith   │
├─────────────────────────────┬─────────────────────────────┤
│                             │                             │
│  📅 Select Date             │  🕐 Available Times         │
│  ┌───────────────────────┐ │  Selected: Nov 21, 2025     │
│  │   November 2025       │ │                             │
│  │ Su Mo Tu We Th Fr Sa  │ │  Morning                    │
│  │        1  2  3  4     │ │  ┌────────┐ ┌────────┐     │
│  │  5  6  7  8  9 10 11  │ │  │ 9:00 AM│ │10:00 AM│     │
│  │ 12 13 14 15 16 17 18  │ │  └────────┘ └────────┘     │
│  │ 19 20 [21] 22 23 24   │ │  ┌────────┐                │
│  │ 25 26 27 28 29 30     │ │  │11:00 AM│                │
│  └───────────────────────┘ │  └────────┘                │
│                             │                             │
│                             │  Afternoon                  │
│                             │  ┌────────┐ ┌────────┐     │
│                             │  │ 1:00 PM│ │ 2:00 PM│ ←   │
│                             │  └────────┘ └────────┘     │
│                             │  ┌────────┐ ┌────────┐     │
│                             │  │ 3:00 PM│ │ 4:00 PM│     │
│                             │  └────────┘ └────────┘     │
│                             │                             │
│  Timezone: EST (GMT-5)      │                             │
│  [Change Timezone]          │  [Continue] ──────────────► │
└─────────────────────────────┴─────────────────────────────┘
```

**Visual Details**
- Split view: Calendar on left (400px), time slots on right
- Time slots grouped by Morning/Afternoon/Evening
- More slots visible (4-5 per row)
- Hover effects on slots

**Screen 4: Customer Details Form**

**Mobile**
```
┌─────────────────────────────────────┐
│ [←]  Your Information               │
├─────────────────────────────────────┤
│ Nov 21, 2025 at 2:00 PM            │
│ Dr. Jane Smith • 30-Min Session     │
├─────────────────────────────────────┤
│                                     │
│ Full Name *                         │
│ ┌─────────────────────────────────┐│
│ │ John Doe                        ││
│ └─────────────────────────────────┘│
│                                     │
│ Email Address *                     │
│ ┌─────────────────────────────────┐│
│ │ john@example.com                ││
│ └─────────────────────────────────┘│
│                                     │
│ Phone Number *                      │
│ ┌──┬──────────────────────────────┐│
│ │+1│ (555) 123-4567              ││
│ └──┴──────────────────────────────┘│
│                                     │
│ Reason for Visit                    │
│ ┌─────────────────────────────────┐│
│ │ Annual check-up                 ││
│ │                                 ││
│ │                                 ││
│ └─────────────────────────────────┘│
│                                     │
│ ☐ I agree to receive SMS reminders │
│   and updates about my appointment  │
│                                     │
│ ☐ I accept the Terms of Service    │
│                                     │
│ [Complete Booking] ────────────────►│
└─────────────────────────────────────┘
```

**Visual Details**

**Form Fields**
- Vertical stack, full-width
- Labels: Above field, Body2, medium weight
- Required: Red asterisk
- TextField height: 56px
- Spacing: 24px between fields
- Validation: Real-time (on blur)
  - Invalid: Red border, helper text below in red
  - Valid: Green checkmark icon on right

**Phone Input**
- Country code dropdown on left (+1, +44, etc.)
- Auto-formatting as user types: (555) 123-4567
- Input mode: tel (numeric keyboard on mobile)

**Multiline (Reason)**
- Min-height: 96px (3 rows)
- Auto-grow as user types
- Character limit: 500 (counter shown: "245/500")

**Checkboxes**
- 24x24px checkbox
- Label: Wrapping text, Body2
- Links in label (Terms): Underlined, opens in modal

**Submit Button**
- Fixed at bottom (above safe area)
- Full-width, 56px height
- Primary color
- Disabled until all required fields valid and terms accepted
- Loading state: Shows circular progress, text "Processing..."

**Desktop**
- Max-width: 600px, centered
- Two-column layout for Name fields: First | Last
- More compact (48px field height)
- Submit button: Right-aligned, auto-width (min 200px)

**Screen 5: Confirmation**

**Mobile**
```
┌─────────────────────────────────────┐
│        ✅ Booking Confirmed!        │
├─────────────────────────────────────┤
│                                     │
│   Your appointment has been         │
│   successfully booked.              │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 📅 Date & Time                  ││
│ │    Wednesday, Nov 21, 2025      ││
│ │    2:00 PM - 2:30 PM EST        ││
│ │                                 ││
│ │ 👤 Provider                     ││
│ │    Dr. Jane Smith               ││
│ │                                 ││
│ │ 📍 Location                     ││
│ │    123 Main St, Suite 200       ││
│ │    [Get Directions]             ││
│ │                                 ││
│ │ 📱 Confirmation                 ││
│ │    Sent to: john@example.com    ││
│ │    and (555) 123-4567           ││
│ └─────────────────────────────────┘│
│                                     │
│ [Add to Calendar] ▼                │
│ [Reschedule]                        │
│ [Cancel Appointment]                │
│                                     │
│ ← Back to Home                      │
└─────────────────────────────────────┘
```

**Visual Details**
- Success icon: Large checkmark (64x64px), green
- Title: H5, centered
- Subtitle: Body1, centered, gray
- Details card: Outlined, rounded, padding 24px
- Icons: 24px, left of each line item
- Primary color for key info (date, time, name)
- Action buttons: Full-width, outlined (secondary style)
- "Add to Calendar" → Download .ics file
- "Reschedule" → Returns to date picker with prefilled info
- "Cancel" → Shows confirmation dialog

**Desktop**
- Max-width: 600px, centered
- Larger success icon (96x96px)
- More spacing, airier layout

---

### 2. Worker Console Shell

**Purpose**: Worker interface for handling SMS, viewing appointments, managing customers

**URL Structure**: `https://app.domain.com/worker/` (or org subdomain with /worker)

#### Layout Structure

**Mobile Layout**
```
┌─────────────────────────────────────┐
│ [☰] Worker Console    [🔔][👤]     │ <- AppBar (56px)
├─────────────────────────────────────┤
│                                     │
│   (Main Content Area)               │
│   - Changes based on active tab     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [🏠]  [💬]  [📅]  [👥]  [⋯]        │ <- Bottom Nav (56px)
│ Home  Inbox Cal   Cust  More        │
└─────────────────────────────────────┘
```

**Desktop Layout**
```
┌──────────────────────────────────────────────────────────────┐
│ [☰] Worker Console         [Search...]     [🔔] [👤]        │ <- AppBar (64px)
├──────┬───────────────────────────────────────────────────────┤
│      │                                                        │
│  🏠  │  (Main Content Area)                                  │
│ Home │  - Full width available                               │
│      │  - Responsive to drawer state                         │
│  💬  │                                                        │
│Inbox │                                                        │
│  12  │                                                        │
│      │                                                        │
│  📅  │                                                        │
│ Cal  │                                                        │
│      │                                                        │
│  👥  │                                                        │
│Cust  │                                                        │
│      │                                                        │
│  ⚙  │                                                        │
│      │                                                        │
│ (280px)                                                      │
└──────┴───────────────────────────────────────────────────────┘
```

**Drawer (Desktop)**
- Width: 280px (expanded) or 64px (collapsed)
- Background: Paper color
- Border-right: 1px divider
- Sections:
  - Main Navigation (Home, Inbox, Calendar, Customers)
  - Quick Actions (New Message, New Appointment)
  - Settings & Help (at bottom)
- Active item: Background in primary color (alpha 0.12), bold text
- Badge: Notification count on Inbox (red circle)

**Bottom Navigation (Mobile)**
- 5 items: Home, Inbox, Calendar, Customers, More
- Active: Primary color icon + label
- Badge: Red dot or count on Inbox
- Safe area: Respects iOS home indicator

#### Worker Console Screens

**Home / Dashboard**

**Mobile**
```
┌─────────────────────────────────────┐
│ [☰] Dashboard          [🔔][👤]     │
├─────────────────────────────────────┤
│                                     │
│ Good morning, Sarah! 👋             │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Today's Appointments            ││
│ │                                 ││
│ │ 9:00 AM  John Doe               ││
│ │          30-Min Consultation    ││
│ │          [View Details]         ││
│ │                                 ││
│ │ 2:00 PM  Jane Smith             ││
│ │          1-Hour Session         ││
│ │          [View Details]         ││
│ │                                 ││
│ │ [View Full Calendar]            ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Unread Messages     [12]        ││
│ │                                 ││
│ │ [Avatar] John Doe               ││
│ │          "Thanks for your..."   ││
│ │          2 minutes ago          ││
│ │                                 ││
│ │ [Avatar] Mary Johnson           ││
│ │          "Can I reschedule..."  ││
│ │          15 minutes ago         ││
│ │                                 ││
│ │ [View All Messages]             ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Quick Stats                     ││
│ │ ┌──────┐ ┌──────┐ ┌──────┐    ││
│ │ │  5   │ │ 12   │ │ 23   │    ││
│ │ │Appts │ │Msgs  │ │Cust  │    ││
│ │ │Today │ │Unread│ │This M││    ││
│ │ └──────┘ └──────┘ └──────┘    ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**

**Greeting**
- H5, user's first name
- Time-based: "Good morning/afternoon/evening"
- Emoji for warmth

**Today's Appointments Card**
- Outlined card, rounded
- Each appointment: 80px height
  - Time (Caption, gray)
  - Customer name (Body1, bold)
  - Service (Body2, gray)
  - Button: Text style, "View Details"
- Divider between appointments
- Footer button: "View Full Calendar" (navigates to Calendar tab)

**Unread Messages Card**
- Badge in header showing count
- List of recent unread (max 3 shown)
- Each message: 64px height
  - Avatar (40px)
  - Customer name (Body2, bold)
  - Message preview (Caption, gray, truncated to 1 line)
  - Timestamp (Caption, gray)
- Footer: "View All Messages" → Inbox tab

**Quick Stats**
- 3 metric cards in a row
- Each card: Square-ish, centered content
  - Large number (H4)
  - Label (Caption, uppercase, gray)
- Primary color for numbers
- Tap: Navigate to relevant section

**Desktop**
```
┌────────────────────────────────────────────────────────────────┐
│ Good morning, Sarah! 👋                                        │
├──────────────────────────────┬─────────────────────────────────┤
│                              │                                 │
│ Today's Appointments         │ Unread Messages      [12]       │
│                              │                                 │
│ 9:00 AM  John Doe            │ [Avatar] John Doe               │
│          30-Min Consultation │         "Thanks for your help!" │
│          [Start] [Reschedule]│         2 minutes ago           │
│                              │                                 │
│ 2:00 PM  Jane Smith          │ [Avatar] Mary Johnson           │
│          1-Hour Session      │         "Can I reschedule to..."│
│          [View Details]      │         15 minutes ago          │
│                              │                                 │
│ [View Full Calendar]         │ [View All Messages]             │
│                              │                                 │
├──────────────────────────────┴─────────────────────────────────┤
│                                                                 │
│ Quick Stats                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │    5     │ │   12     │ │   23     │ │   18     │         │
│ │Appts     │ │Messages  │ │Customers │ │Hours     │         │
│ │Today     │ │Unread    │ │This Month│ │This Week │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Two-column layout for appointments and messages
- More stats (4 cards)
- More action buttons per appointment

**Inbox / Messages Screen**

**Mobile - Thread List View**
```
┌─────────────────────────────────────┐
│ [☰] Inbox                 [🔍][⋮]  │
├─────────────────────────────────────┤
│ Filters: [All ▼] [Status ▼]        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ [Avatar] John Doe         2m    ││ <- Unread (bold)
│ │ ● Thanks for your help with...  ││    Dot indicator
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Mary Johnson     15m   ││
│ │   Can I reschedule my appt to...││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Robert Lee       1h    ││
│ │   Appointment confirmed. See... ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Lisa Wong        3h    ││
│ │   Hi, I have a question about...││
│ └─────────────────────────────────┘│
│                                     │
│                                     │
└─────────────────────────────────────┘
   └─ Swipe left to delete/archive
```

**Visual Details**

**Thread Item**
- Height: 72px
- Left: Avatar (48px, circular)
- Right:
  - Top row: Customer name (Body1, bold if unread) + Timestamp (Caption, gray)
  - Bottom row: Message preview (Body2, gray, 1 line truncated)
- Unread indicator: Blue dot (8px) next to avatar
- Background: White (light mode), hover: light gray
- Tap: Opens conversation view
- Swipe left: Reveals action buttons (Archive, Delete)
- Swipe right: Mark as read/unread

**Filters**
- Chip selects at top
- "All", "Unread", "Open", "Closed"
- Status filter: Assigned to me, Unassigned, etc.

**Search**
- Icon button in app bar
- Tap: Expands to full-width search input
- Search: Customer name, phone, message content
- Real-time results as you type

**Mobile - Conversation View**
```
┌─────────────────────────────────────┐
│ [←] [Avatar] John Doe        [⋮]   │
├─────────────────────────────────────┤
│                                     │
│         Hi, I need to reschedule    │
│         my appointment for Friday   │
│         ┌─────────────────────┐    │
│         │ 10:23 AM            │    │
│         └─────────────────────┘    │
│                                     │
│ ┌─────────────────────┐            │
│ │ Sure! What time     │            │
│ │ works for you?      │            │
│ │            10:25 AM │            │
│ └─────────────────────┘            │
│                                     │
│         How about Tuesday at 2pm?   │
│         ┌─────────────────────┐    │
│         │ 10:27 AM   ✓✓      │    │ <- Read status
│         └─────────────────────┘    │
│                                     │
│ ┌─────────────────────┐            │
│ │ Perfect! I've       │            │
│ │ updated your        │            │
│ │ appointment.        │            │
│ │            10:28 AM │            │
│ └─────────────────────┘            │
│                                     │
├─────────────────────────────────────┤
│ [+] [Type a message...]      [Send]│ <- Input bar (56px)
└─────────────────────────────────────┘
```

**Visual Details**

**Message Bubbles**
- Inbound (customer): Left-aligned, gray background (#F0F0F0)
- Outbound (worker): Right-aligned, primary color background, white text
- Max-width: 75% of screen width
- Border-radius: 16px (rounded)
- Padding: 12px horizontal, 8px vertical
- Timestamp: Caption, gray, outside bubble (below)
- Delivery status (outbound): ✓ Sent, ✓✓ Delivered, ✓✓ Read (blue)

**Message Types**
- Text: Standard bubble
- Image/MMS: Image thumbnail in bubble, tap to view full-screen
- System messages (e.g., "Appointment confirmed"): Centered, italic, gray

**Header**
- Avatar and name
- Tap: Opens customer profile (slide-over or modal)
- Menu (⋮): Options (Assign, Archive, Block, View Profile)

**Input Bar**
- Fixed at bottom (above safe area)
- Height: 56px (expands if multiline)
- Left: + button (attach image/file)
- Center: TextField (auto-growing, max 4 lines)
- Right: Send button (icon or text, primary color)
- Send button: Disabled if input empty, shows loading on sending

**Typing Indicator**
```
┌─────────────────────┐
│ John Doe is typing  │
│ ●●●                 │ <- Animated dots
└─────────────────────┘
```

**Desktop - Split View**
```
┌────────────────────────────────────────────────────────────────┐
│ [☰] Inbox                              [Search...]  [🔔] [👤]  │
├──────┬──────────────────────┬──────────────────────────────────┤
│      │                      │                                   │
│  🏠  │ Thread List (320px)  │ Conversation View                │
│      │                      │                                   │
│  💬  │ [All ▼] [Status ▼]  │ [Avatar] John Doe          [⋮]   │
│Inbox │                      │ ────────────────────────────────  │
│  12  │ ┌──────────────────┐│                                   │
│      │ │[A] John Doe   2m ││      Hi, I need to reschedule...│
│  📅  │ │● Thanks for... →││ (Customer message on right)       │
│      │ └──────────────────┘│                                   │
│      │ ┌──────────────────┐│ ┌─────────────────────┐          │
│  👥  │ │[A] Mary J.    15m││ │ Sure! What time...  │ (Worker) │
│      │ │  Can I resc...   ││ │            10:25 AM │          │
│      │ └──────────────────┘│ └─────────────────────┘          │
│      │ ┌──────────────────┐│                                   │
│  ⚙  │ │[A] Robert L.  1h ││      How about Tuesday at 2pm?  │
│      │ │  Appointment...  ││                                   │
│      │ └──────────────────┘│ ┌─────────────────────┐          │
│      │                      │ │ Perfect! I've...    │          │
│      │ (More threads...)    │ │            10:28 AM │          │
│      │                      │ └─────────────────────┘          │
│      │                      │                                   │
│      │                      │ ────────────────────────────────  │
│      │                      │ [Type a message...]        [Send]│
│(280px)│     (320px)         │              (Flexible)           │
└──────┴──────────────────────┴──────────────────────────────────┘
```

**Visual Details**
- Three-pane layout (Drawer + Thread List + Conversation)
- Thread list: Fixed 320px width, scrollable
- Conversation: Flexible, takes remaining space
- Selected thread: Highlighted background in list
- Hover on threads: Light gray background
- Click thread: Loads conversation on right
- Keyboard shortcuts:
  - Ctrl+K: Focus search
  - Cmd+N: New message
  - Esc: Close conversation (back to list only)
  - Up/Down arrows: Navigate threads

**Calendar Screen**

**Mobile - Month View**
```
┌─────────────────────────────────────┐
│ [☰] Calendar              [+][⋮]   │
├─────────────────────────────────────┤
│                                     │
│ ← November 2025 →                   │
│ Su Mo Tu We Th Fr Sa                │
│           1  2  3  4                │
│  5  6  7  8  9 10 11                │
│ 12 13 14 15 16 17 18                │
│ 19 20 ●21 22 23 24 25               │ <- ● = has events
│ 26 27 ●28 29 30                     │
│                                     │
├─────────────────────────────────────┤
│ Today • Nov 21, 2025                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ 9:00 AM - 9:30 AM               ││
│ │ John Doe                        ││
│ │ 30-Min Consultation             ││
│ │ ───────────────────────           ││ <- Color bar (status)
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ 2:00 PM - 3:00 PM               ││
│ │ Jane Smith                      ││
│ │ 1-Hour Session                  ││
│ │ ───────────────────────           ││
│ └─────────────────────────────────┘│
│                                     │
│ [View Week] [View Day]              │
└─────────────────────────────────────┘
```

**Visual Details**

**Month Calendar**
- Compact, fits above fold
- Tap date: Shows that day's events below
- Dot indicator: Shows if day has events (multiple colors if multiple)
- Today: Circled in primary color
- Selected: Filled circle

**Event List (Below Calendar)**
- Shows selected day's events
- Each event card:
  - Time range (Caption, gray)
  - Customer name (Body1, bold)
  - Service (Body2, gray)
  - Status color bar (left border: 4px)
    - Green: Confirmed
    - Orange: Pending
    - Blue: Completed
    - Red: Canceled
- Tap event: Opens event details modal

**Action Buttons**
- [+] FAB: Create new appointment (bottom-right)
- [⋮] Menu: View options (Day, Week, Month), filters

**Mobile - Day View**
```
┌─────────────────────────────────────┐
│ [☰] Calendar              [+][⋮]   │
├─────────────────────────────────────┤
│ ← Thursday, Nov 21, 2025 →          │
├─────────────────────────────────────┤
│                                     │
│ 8:00 AM ────────────────────────    │
│                                     │
│ 9:00 AM ┌──────────────────────┐   │
│         │ John Doe             │   │
│         │ 30-Min Consultation  │   │
│ 9:30 AM └──────────────────────┘   │
│                                     │
│ 10:00 AM ────────────────────────   │
│                                     │
│ 11:00 AM ────────────────────────   │
│                                     │
│ 12:00 PM ────────────────────────   │
│                                     │
│ 1:00 PM ────────────────────────    │
│                                     │
│ 2:00 PM ┌──────────────────────┐   │
│         │ Jane Smith           │   │
│         │ 1-Hour Session       │   │
│         │                      │   │
│ 3:00 PM └──────────────────────┘   │
│                                     │
│ 4:00 PM ────────────────────────    │
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**
- Hour blocks (1-hour increments)
- Appointments: Positioned by time, height = duration
- Color-coded by status
- Tap time slot: Create new appointment at that time
- Tap event: View/edit details
- Scroll: Smooth scrolling through day
- Current time: Red line indicator (if today)

**Desktop - Week View**
```
┌────────────────────────────────────────────────────────────────┐
│ ← November 16-22, 2025 →          [Month][Week][Day] [+]      │
├────────┬───────┬───────┬───────┬───────┬───────┬───────┬──────┤
│        │Sun 16 │Mon 17 │Tue 18 │Wed 19 │Thu 20 │Fri 21 │Sat 22│
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼──────┤
│ 8:00 AM│       │       │       │       │       │       │      │
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼──────┤
│ 9:00 AM│       │ ┌───┐ │       │       │       │ ┌───┐ │      │
│        │       │ │John│ │       │       │       │ │...│ │      │
│ 9:30 AM│       │ └───┘ │       │       │       │ └───┘ │      │
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼──────┤
│10:00 AM│       │       │       │       │       │       │      │
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼──────┤
│ ...    │       │       │       │       │       │       │      │
└────────┴───────┴───────┴───────┴───────┴───────┴───────┴──────┘
```

**Visual Details**
- Grid: 7 columns (days) x 1-hour rows
- Events: Blocks positioned in grid
- Hover: Tooltip with full event details
- Click: Edit event
- Drag: Reschedule (drag to different time/day)
- Multi-day events: Span across columns

**Customers Screen**

**Mobile - List View**
```
┌─────────────────────────────────────┐
│ [☰] Customers            [🔍][+]   │
├─────────────────────────────────────┤
│ [All ▼] [Sort: Name ▼]              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ [Avatar] John Doe               ││
│ │          (555) 123-4567         ││
│ │          Last: 2 days ago       ││
│ │          ✓ SMS Opt-in           ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Jane Smith             ││
│ │          (555) 987-6543         ││
│ │          Last: 1 week ago       ││
│ │          ✓ SMS Opt-in           ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Avatar] Robert Lee             ││
│ │          (555) 555-5555         ││
│ │          Last: 3 hours ago      ││
│ │          ✗ SMS Opt-out          ││
│ └─────────────────────────────────┘│
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**
- Customer cards: Full-width, 96px height
- Avatar: 56px, circular
- Info:
  - Name (Body1, bold)
  - Phone (Body2, gray)
  - Last contact (Caption, gray)
  - Opt-in status (Caption with icon, green/red)
- Tap: Opens customer detail view
- Search: Filter by name, phone, tags
- Sort: Name, Last Contact, Date Added
- [+] FAB: Add new customer manually

**Mobile - Customer Detail**
```
┌─────────────────────────────────────┐
│ [←] Customer              [⋮]       │
├─────────────────────────────────────┤
│           [Large Avatar]             │
│           John Doe                   │
│           ⭐ VIP Customer            │
├─────────────────────────────────────┤
│ 📞 (555) 123-4567      [Call][SMS]  │
│ ✉ john@example.com     [Email]      │
│ 📍 123 Main St, Apt 4               │
│    New York, NY 10001               │
├─────────────────────────────────────┤
│ Tags: [VIP] [Regular] [+]           │
├─────────────────────────────────────┤
│                                     │
│ 📊 Stats                            │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │  12  │ │  3   │ │ 95%  │        │
│ │Appts │ │NoShow│ │Show  │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
│ [Tabs: Timeline | Appointments | Notes]
│                                     │
│ Timeline:                           │
│ ┌─────────────────────────────────┐│
│ │ 📅 Appointment Completed        ││
│ │    Nov 18, 2025 • 2:00 PM      ││
│ │    30-Min Consultation          ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ 💬 Message Sent                 ││
│ │    Nov 15, 2025 • 10:30 AM     ││
│ │    "Thanks for confirming..."   ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ 📅 Appointment Booked           ││
│ │    Nov 14, 2025 • 3:45 PM      ││
│ │    Booked for Nov 18            ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Visual Details**

**Header Section**
- Large avatar (120px)
- Name (H5)
- Tags/badges (VIP, Frequent, etc.)
- Action menu (⋮): Edit, Merge, Delete

**Contact Section**
- Each contact method with icon
- Action buttons: Call (opens dialer), SMS (opens inbox), Email (opens mail)

**Stats Cards**
- 3 metrics: Total appointments, No-shows, Show rate
- Quick visual KPIs

**Tabs**
- Timeline: All interactions (messages, appointments, notes)
- Appointments: List of past/upcoming appointments
- Notes: Internal notes (create, edit, delete)

**Desktop - Split View**
```
┌────────────────────────────────────────────────────────────────┐
│ [☰] Customers        [Search...]              [+] [⋮]          │
├──────┬──────────────────────────┬──────────────────────────────┤
│      │                          │                               │
│  🏠  │ Customer List (360px)    │ Customer Detail               │
│      │                          │                               │
│  💬  │ [All ▼] [Sort ▼]        │     [Large Avatar]           │
│      │                          │     John Doe                 │
│  📅  │ ┌──────────────────────┐│     ⭐ VIP Customer          │
│      │ │[A] John Doe       →  ││                               │
│  👥  │ │(555) 123-4567        ││ 📞 (555) 123-4567  [Actions]│
│Cust  │ │Last: 2 days ago      ││ ✉ john@example.com          │
│      │ └──────────────────────┘│                               │
│      │ ┌──────────────────────┐│ Tags: [VIP] [Regular] [+]   │
│  ⚙  │ │[A] Jane Smith        ││                               │
│      │ │(555) 987-6543        ││ Stats: 12 Appts | 3 NoShow  │
│      │ │Last: 1 week ago      ││                               │
│      │ └──────────────────────┘│ [Timeline|Appointments|Notes]│
│      │                          │                               │
│      │ (More customers...)      │ (Timeline content...)         │
│      │                          │                               │
│(280px)│       (360px)           │         (Flexible)            │
└──────┴──────────────────────────┴──────────────────────────────┘
```

---

### 3. Admin Dashboard Shell

**Purpose**: Organization admin interface for managing settings, users, numbers, services, webhooks

**URL Structure**: `https://app.domain.com/admin/` (or org subdomain with /admin)

#### Layout - Similar to Worker Console but with Additional Admin-Only Sections

**Desktop Drawer Navigation**
- Dashboard
- Messages (same as worker)
- Calendar (all workers' appointments)
- Customers (all)
- **Users & Permissions** (admin only)
- **Phone Numbers** (admin only)
- **Services** (admin only)
- **Webhooks & Integrations** (admin only)
- **Organization Settings** (admin only)
- **Billing** (admin only, future)

**Admin-Only Screens**

**Users & Permissions**
```
┌────────────────────────────────────────────────────────────────┐
│ Users & Permissions                              [Invite User] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Search users...]  [Filter: All ▼] [Role: All ▼]              │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Name         │ Email            │ Role   │ Status │ Actions││
│ ├────────────────────────────────────────────────────────────┤│
│ │[A] Sarah J.  │sarah@org.com     │ Admin  │Active  │ [⋮]   ││
│ │[A] Mike T.   │mike@org.com      │ Worker │Active  │ [⋮]   ││
│ │[A] Lisa W.   │lisa@org.com      │ Worker │Active  │ [⋮]   ││
│ │[A] John D.   │john@org.com      │ Worker │Invited │ [⋮]   ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Showing 1-4 of 4 users            [< 1 >]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Visual Details**
- Table on desktop, cards on mobile
- Actions menu: Edit role, Resend invitation, Deactivate, Delete
- Status badges: Active (green), Invited (orange), Disabled (gray)

**Phone Numbers**
```
┌────────────────────────────────────────────────────────────────┐
│ Phone Numbers                              [Purchase Number]   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Number          │ Type    │ Assigned To     │ Actions      ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ (555) 123-4567  │ Worker  │ Sarah Johnson   │ [Edit][Del] ││
│ │ (555) 987-6543  │ Worker  │ Mike Thompson   │ [Edit][Del] ││
│ │ (555) 111-2222  │ IVR     │ Shared Inbox    │ [Edit][Del] ││
│ │ (555) 333-4444  │ Pool    │ Unassigned      │ [Assign]    ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Purchase Number] Dialog:                                       │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Search by:                                                 ││
│ │ Country: [United States ▼]                                ││
│ │ Area Code: [555]                                          ││
│ │ Capabilities: ☑ SMS  ☑ Voice  ☐ MMS                      ││
│ │                                                            ││
│ │ Available Numbers:                                         ││
│ │ ○ (555) 123-0001  Local   $1.00/month   [Purchase]       ││
│ │ ○ (555) 123-0002  Local   $1.00/month   [Purchase]       ││
│ │ ○ (800) 555-0001  Toll-free $2.00/month [Purchase]       ││
│ └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Organization Settings**
```
┌────────────────────────────────────────────────────────────────┐
│ Organization Settings                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Tabs: General | Branding | Business Hours | Compliance]      │
│                                                                 │
│ General:                                                        │
│ Organization Name    [Acme Medical Clinic____________]         │
│ Organization Slug    [acme-medical] .domain.com                │
│ Timezone             [America/New_York ▼]                      │
│ Country              [United States ▼]                         │
│                                                                 │
│ Branding:                                                       │
│ Logo                 [Upload Image]  [Remove]                  │
│                      [Preview Image]                           │
│ Primary Color        [#1976D2] [Color Picker]                  │
│ Secondary Color      [#DC004E] [Color Picker]                  │
│ Custom Domain        [booking.acmemed.com_____________]         │
│                      DNS Instructions: Add CNAME...            │
│                                                                 │
│ Business Hours:                                                 │
│ Monday      ☑  [9:00 AM ▼] to [5:00 PM ▼]                     │
│ Tuesday     ☑  [9:00 AM ▼] to [5:00 PM ▼]                     │
│ ...                                                             │
│ Sunday      ☐  Closed                                          │
│                                                                 │
│ [Save Changes]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile-Specific Optimizations

### iOS-Specific

#### Safe Area Handling
```css
/* iOS notch and home indicator */
.app-bar {
  padding-top: env(safe-area-inset-top);
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.modal-fullscreen {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### Smooth Scrolling
```css
/* iOS momentum scrolling */
.scrollable-container {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

#### Input Zoom Prevention
```html
<!-- Prevent iOS zoom on focus -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

<!-- Or better: Use 16px font size -->
<TextField inputProps={{ style: { fontSize: 16 } }} />
```

#### Native-Feeling Gestures
- Swipe from left edge → Back navigation (implement with react-swipeable)
- Pull-to-refresh on lists (react-pull-to-refresh)
- Haptic feedback on actions (vibration API)
```javascript
// Haptic feedback
navigator.vibrate(10); // Short vibration on button press
```

### Android-Specific

#### System Back Button
```javascript
// Handle Android back button
useEffect(() => {
  const handleBackButton = () => {
    if (modalOpen) {
      closeModal();
      return true; // Prevent default
    }
    return false; // Allow default (go back)
  };

  // Add listener (using react-native-web or custom logic)
  window.addEventListener('popstate', handleBackButton);
  return () => window.removeEventListener('popstate', handleBackButton);
}, [modalOpen]);
```

#### Ripple Effects
Material-UI automatically adds ripple effects on touch. Ensure TouchRipple is enabled:
```javascript
<Button disableRipple={false}> {/* Default is false */}
```

#### Status Bar Theming
```html
<!-- Android status bar color -->
<meta name="theme-color" content="#1976D2">
```

### Touch Optimizations

#### Minimum Touch Targets
- All interactive elements: Minimum 44x44px (iOS), 48x48px (Material)
- Spacing between targets: Minimum 8px

#### Prevent Double-Tap Zoom
```css
/* Prevent double-tap zoom on buttons */
button, a {
  touch-action: manipulation;
}
```

#### Fast Click (Eliminate 300ms Delay)
- Modern browsers already eliminate this with `viewport` meta tag
- Double-check with `user-scalable=no` if needed (but prefer accessibility)

### Performance for Mobile

#### Lazy Loading Images
```javascript
<img src={thumbnail} loading="lazy" />
```

#### Virtualized Lists for Long Data
```javascript
import { FixedSizeList } from 'react-window';
// Render only visible items
```

#### Code Splitting
```javascript
const Calendar = lazy(() => import('./pages/Calendar'));
// Load on demand
```

#### Service Worker (PWA)
- Cache static assets
- Offline fallback pages
- Background sync for failed API calls

---

## Animations & Transitions

### Material Motion Principles
- **Duration**: Fast (150ms), Standard (300ms), Complex (500ms)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- **Purpose**: Provide feedback, guide attention, express hierarchy

### Common Animations

#### Page Transitions
```javascript
import { Fade, Slide } from '@mui/material';

<Fade in={true} timeout={300}>
  <Box>Page Content</Box>
</Fade>

<Slide direction="left" in={true}>
  <Box>Slides from right</Box>
</Slide>
```

#### Button Press
```css
.button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.button:active {
  transform: scale(0.95);
}
```

#### Card Hover (Desktop)
```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}
```

#### Modal Entry
```javascript
<Modal
  open={open}
  TransitionComponent={Fade}
  transitionDuration={300}
>
```

#### Loading Skeleton
```javascript
import { Skeleton } from '@mui/material';

<Skeleton variant="text" width="100%" height={24} />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" width="100%" height={118} />
```

**Appears while data loads, then fades to actual content**

#### Progress Indicators
```javascript
// Linear (top of page)
<LinearProgress color="primary" sx={{ position: 'fixed', top: 0, left: 0, right: 0 }} />

// Circular (center of container)
<CircularProgress size={48} />

// With overlay
<Backdrop open={loading}>
  <CircularProgress color="inherit" />
</Backdrop>
```

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

#### Color Contrast
- Text: Minimum 4.5:1 ratio (normal text), 3:1 (large text 18pt+)
- UI Components: Minimum 3:1 ratio (buttons, form borders)
- Test: Use Chrome DevTools Lighthouse or WebAIM Contrast Checker

#### Keyboard Navigation
- All interactive elements: Tabbable (focusable)
- Focus indicators: Visible outline (2px, primary color)
- Skip links: "Skip to main content" for screen readers
- Keyboard shortcuts: Document and avoid conflicts

```javascript
// Focus indicator
sx={{
  '&:focus': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2
  }
}}
```

#### Screen Reader Support
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`
- ARIA labels: For icon-only buttons
```javascript
<IconButton aria-label="Delete customer">
  <DeleteIcon />
</IconButton>
```
- ARIA live regions: For dynamic content (new message notification)
```javascript
<div role="status" aria-live="polite" aria-atomic="true">
  New message from John Doe
</div>
```

#### Form Accessibility
- Labels: Associated with inputs (`htmlFor` and `id`)
- Required fields: Indicated visually and with `aria-required`
- Error messages: Announced to screen readers with `aria-describedby`
```javascript
<TextField
  id="email"
  label="Email"
  required
  error={!!error}
  helperText={error}
  aria-describedby="email-error"
  aria-required="true"
/>
```

#### Focus Management
- Modal opens: Focus moves to first element inside
- Modal closes: Focus returns to trigger element
- Form submits: Focus moves to success message or first error

#### Alt Text for Images
```javascript
<Avatar alt="John Doe" src="/avatar.jpg" />
// If no image, shows initials "JD"

<img src="/service.jpg" alt="30-minute consultation service" />
// Descriptive, not "image" or filename
```

---

## Performance Optimization

### Load Time Optimization

#### Code Splitting
```javascript
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inbox = lazy(() => import('./pages/Inbox'));

<Route path="/dashboard" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
```

#### Image Optimization
- Format: WebP with JPEG fallback
- Responsive images: `srcset` with multiple sizes
- Lazy loading: `loading="lazy"`
- CDN: Serve from CloudFlare or AWS CloudFront

```html
<img
  src="/images/service-400w.webp"
  srcset="/images/service-400w.webp 400w,
          /images/service-800w.webp 800w,
          /images/service-1200w.webp 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 400px"
  alt="Service"
  loading="lazy"
/>
```

#### Font Loading
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossorigin>

/* Font display swap (show fallback immediately) */
@font-face {
  font-family: 'Roboto';
  font-display: swap;
  src: url('/fonts/roboto.woff2') format('woff2');
}
```

### Runtime Performance

#### Memoization
```javascript
// Expensive computation
const sortedCustomers = useMemo(() => {
  return customers.sort((a, b) => a.name.localeCompare(b.name));
}, [customers]);

// Prevent re-render
const CustomerCard = memo(({ customer }) => {
  return <Card>...</Card>;
});
```

#### Debouncing
```javascript
// Search input
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500); // Wait 500ms after typing stops

useEffect(() => {
  // API call with debouncedSearch
}, [debouncedSearch]);
```

#### Virtualization
```javascript
// For lists with 1000+ items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={customers.length}
  itemSize={72}
>
  {({ index, style }) => (
    <div style={style}>
      <CustomerCard customer={customers[index]} />
    </div>
  )}
</FixedSizeList>
```

### Bundle Size Optimization

#### Tree Shaking
```javascript
// Import only what you need from MUI
import Button from '@mui/material/Button';
// NOT: import { Button } from '@mui/material'; (imports everything)
```

#### Analyze Bundle
```bash
# Using webpack-bundle-analyzer
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

**Target**: Main bundle < 200KB gzipped

### Caching Strategy

#### Service Worker (PWA)
```javascript
// Cache-first for static assets
// Network-first for API calls
// Stale-while-revalidate for images
```

#### HTTP Caching Headers
- Static assets (JS, CSS, images): `Cache-Control: max-age=31536000, immutable`
- HTML: `Cache-Control: no-cache` (revalidate)
- API: `Cache-Control: private, no-store`

---

## Conclusion

This UI specification provides a comprehensive, detailed blueprint for building a modern, responsive, accessible, and performant client interface using Material-UI. Every component, screen, and interaction has been carefully designed to work seamlessly across iOS, Android, tablets, and desktop devices while maintaining consistency with Material Design 3 principles.

### Key Takeaways

1. **Mobile-First**: Design for smallest screens first, then enhance for larger devices
2. **Material-UI**: Leverage MUI's comprehensive component library for consistency and speed
3. **Responsive Breakpoints**: xs, sm, md, lg, xl cover all device sizes
4. **Touch-Optimized**: 44-48px minimum touch targets, swipe gestures, native feel
5. **Accessibility**: WCAG 2.1 AA compliance ensures usability for all users
6. **Performance**: Code splitting, lazy loading, virtualization, image optimization
7. **Animations**: Material Motion for feedback, guidance, and delight
8. **Platform-Specific**: iOS safe areas, Android back button, haptic feedback

### Development Workflow

1. **Component Library**: Build reusable components first (Button, TextField, Card)
2. **Layout Shells**: Implement responsive shells (Public Portal, Worker Console, Admin Dashboard)
3. **Screen by Screen**: Build each screen following this specification
4. **Responsive Testing**: Test on real devices (iOS iPhone, Android phone, iPad, desktop)
5. **Accessibility Audit**: Use Lighthouse, axe DevTools, manual keyboard testing
6. **Performance Audit**: Lighthouse Performance score > 90
7. **User Testing**: Beta test with real workers and customers

### Maintenance

- **Component Documentation**: Storybook for all components with examples
- **Design System Updates**: Keep in sync with Material Design updates
- **Responsive Regressions**: Automated visual regression testing (Percy, Chromatic)
- **Accessibility Monitoring**: Continuous monitoring with axe-core
- **Performance Monitoring**: Real User Monitoring (RUM) with Web Vitals

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Maintained By**: Frontend Team
**Next Review**: Quarterly or on major Material-UI updates
