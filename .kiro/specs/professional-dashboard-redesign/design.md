# Design Document: Professional Dashboard Redesign

## Overview

### Purpose

This design document specifies the technical implementation for transforming the SalesFlow Pro owner dashboard from its current state into an enterprise-quality interface that meets professional business software standards. The redesign focuses exclusively on visual improvements—styling, spacing, typography, and polish—without modifying functionality, data logic, or component APIs.

### Scope

**In Scope:**
- Visual styling updates to existing components (Sidebar, StatCard, BranchCard)
- Tailwind CSS utility class refinements and custom theme extensions
- Typography scale implementation
- Spacing system standardization
- Color palette refinement
- Shadow and border styling
- Interactive state improvements (hover, focus, active)
- Layout grid adjustments for the dashboard content area

**Out of Scope:**
- Functional changes to component behavior
- Data fetching or business logic modifications
- New features or capabilities
- API changes to component props
- Responsive behavior for mobile/tablet (desktop-first, 1024px+ only)
- Accessibility improvements beyond visible focus states

### Design Goals

1. **Enterprise Visual Quality**: Match the professional appearance of established business software (Salesforce, HubSpot, Stripe Dashboard)
2. **Visual Consistency**: Apply a unified design system across all dashboard components
3. **Clear Hierarchy**: Make primary information immediately scannable through typography and spacing
4. **Non-Breaking Changes**: Maintain all existing component interfaces and functionality
5. **Tailwind-First**: Leverage existing Tailwind CSS infrastructure without adding new dependencies

### Technical Context

**Current Stack:**
- **Framework**: React 19 with TanStack Router
- **Styling**: Tailwind CSS v4.2 with custom theme configuration
- **Icons**: lucide-react (already installed)
- **UI Primitives**: Radix UI components (already installed)
- **Build Tool**: Vite

**Existing Configuration:**
- Tailwind v4 with `@theme inline` directive in `src/styles.css`
- Custom CSS variables for colors using OKLCH color space
- DM Sans and Space Grotesk fonts already configured
- 8px base spacing system already defined
- Custom shadow utilities (`.shadow-soft`, `.shadow-card`, `.shadow-elevated`)

---

## Architecture

### Component Structure

The dashboard redesign maintains the existing component hierarchy:

```
/owner/dashboard (Route)
  ├── Sidebar (Layout Component)
  ├── Header (Layout Component)
  └── Main Content Area
      ├── StatCard (Metric Display)
      ├── BranchCard (Performance Display)
      ├── RevenueChart (Data Visualization)
      └── ActivityItem (List Item)
```

### Styling Strategy

**Approach: Tailwind Utility-First with Theme Extensions**

We will use a pure Tailwind CSS approach, extending the existing theme configuration in `src/styles.css` rather than creating separate CSS modules. This approach:

1. Maintains consistency with the existing codebase
2. Leverages Tailwind's built-in optimization and purging
3. Allows for easy theme-wide updates via CSS variables
4. Provides excellent developer experience with autocomplete

**Theme Extension Points:**
- Custom color tokens (already defined, will refine)
- Typography scale (already partially defined, will complete)
- Spacing scale (8px base already defined)
- Shadow utilities (already defined, will use)
- Border radius tokens (already defined)

### State Management

No changes to state management. All interactive states (hover, focus, active) will be handled through Tailwind's built-in state variants (`hover:`, `focus:`, `active:`).

---

## Components and Interfaces

### 1. Sidebar Component

**File**: `src/components/layout/Sidebar.tsx`

**Current State:**
- Dark navy background (#0F1B33)
- Placeholder icon implementation (dots)
- Basic active state handling via inline conditional
- Fixed width at 256px (w-64)

**Design Changes:**

#### Visual Specifications

| Element | Current | New Specification |
|---------|---------|-------------------|
| Width | 256px (w-64) | 260px (w-[260px]) |
| Background | #0F1B33 | `bg-sidebar` (using CSS variable) |
| Nav Item Padding | px-4 py-2 | px-4 py-3 (12px vertical) |
| Nav Item Spacing | space-y-2 | space-y-1 (4px gap) |
| Icon Size | w-5 h-5 (20px) | w-5 h-5 (maintained) |
| Icon-Text Gap | space-x-3 | space-x-3 (maintained) |
| Text Size | text-[13px] | text-sm (14px) |
| Active Indicator | bg-[#2563EB] | bg-sidebar-primary with left border accent |
| Hover State | hover:bg-[#1E293B] | hover:bg-sidebar-accent transition-smooth |

#### Icon Integration

Replace placeholder icon implementation with lucide-react icons:

```typescript
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Target,
  Package,
  ShoppingCart,
  Users,
  FileText,
  History,
  Settings
} from "lucide-react";

const iconMap = {
  dashboard: LayoutDashboard,
  branches: Building2,
  sales: TrendingUp,
  targets: Target,
  inventory: Package,
  products: ShoppingCart,
  team: Users,
  reports: FileText,
  audit: History,
  settings: Settings,
};
```

#### Active State Pattern

Implement visual distinction for active navigation items:

```tsx
<Link
  to={item.href}
  className={cn(
    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-smooth",
    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
    item.active && "bg-sidebar-accent text-sidebar-foreground border-l-4 border-sidebar-primary pl-[14px]"
  )}
>
```

#### Implementation Notes

- Use `lucide-react` icons at 20px size
- Apply 150ms transitions to background and text color changes
- Active state includes left border accent (4px) and adjusted padding to prevent layout shift
- User profile section at bottom maintains current structure with improved badge styling

**Interface Stability**: No prop changes, maintains existing component API

---

### 2. StatCard Component

**File**: `src/components/dashboard/StatCard.tsx`

**Current State:**
- White background with border
- Flexible content via children prop
- Badge support (green, amber, red)
- Optional link and action areas
- Skeleton loading state

**Design Changes:**

#### Visual Specifications

| Element | Current | New Specification |
|---------|---------|-------------------|
| Background | bg-white | bg-card (CSS variable, white) |
| Border | border-[#E5E9F0] | border-border (CSS variable) |
| Shadow | shadow | shadow-card (custom utility) |
| Border Radius | rounded-lg | rounded-xl (12px) |
| Padding | p-4 (16px) | p-6 (24px) |
| Label Font Size | text-[11px] | text-xs (12px) |
| Label Weight | font-[600] | font-semibold |
| Label Color | text-[#64748B] | text-muted-foreground |
| Value Font Size (large) | text-[34px] | text-4xl (36px) |
| Value Font Size (small) | text-2xl | text-2xl (maintained) |
| Value Weight | font-[700] | font-bold |
| Value Color | text-[#0F1B33] | text-foreground |
| Caption Font Size | text-[12px] | text-sm (14px) |
| Caption Color | text-[#64748B] | text-muted-foreground |

#### Badge Styling Refinement

Current badge implementation uses manual color classes. Refine for consistency:

```tsx
const badgeStyles = {
  green: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-success/10 text-success",
  amber: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-warning/10 text-warning-foreground",
  red: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-danger/10 text-danger"
};
```

#### Spacing Adjustments

- Label to Value gap: mb-2 → mb-3 (12px)
- Value to Caption gap: mt-2 (8px, maintained)
- Action/Link margin top: mt-3 → mt-4 (16px)

#### Hover State (for clickable cards)

Add subtle elevation on hover when card is clickable:

```tsx
className={cn(
  "relative bg-card rounded-xl border border-border shadow-card transition-smooth",
  onClick && "cursor-pointer hover:shadow-elevated"
)}
```

**Interface Stability**: No prop changes, maintains all existing props

---

### 3. BranchCard Component

**File**: `src/components/dashboard/BranchCard.tsx`

**Current State:**
- White card with status badge
- Revenue and target display
- Daily submissions counter
- "View Detail" link
- Click handler for navigation
- Defensive rendering for missing data

**Design Changes:**

#### Visual Specifications

| Element | Current | New Specification |
|---------|---------|-------------------|
| Background | bg-white | bg-card |
| Border | border-[#E5E9F0] | border-border |
| Shadow | shadow | shadow-card |
| Border Radius | rounded-lg | rounded-xl |
| Padding | p-4 | p-5 (20px) |
| Branch Name Size | text-[14px] | text-base (16px) |
| Branch Name Weight | font-[600] | font-semibold |
| Revenue Text Size | text-[14px] | text-base (16px) |
| Revenue Text Weight | font-[400] | font-medium |
| Revenue Text Color | text-[#334155] | text-foreground |
| Submissions Text Size | text-[12px] | text-xs (12px) |
| Submissions Text Color | text-[#64748B] | text-muted-foreground |
| Hover Background | hover:bg-[#F8FAFC] | hover:bg-muted/30 hover:shadow-elevated |

#### Status Badge Alignment

Current badge positioning (absolute top-2 right-2) is maintained, but styling updated to match StatCard badge system:

```tsx
const statusStyles = {
  green: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-success/10 text-success",
  amber: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-warning/10 text-warning-foreground",
  red: "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-danger/10 text-danger"
};
```

#### Spacing Adjustments

- Branch name to revenue: mt-3 → mt-4 (16px)
- Revenue to submissions row: mt-3 → mt-4 (16px)

#### Link Styling

"View Detail" link updated for consistency:

```tsx
<Link
  to={`/owner/branches/${branch.id}`}
  className="text-sm font-semibold text-primary hover:underline underline-offset-4"
  onClick={(e) => e.stopPropagation()}
>
  View Detail →
</Link>
```

**Interface Stability**: No prop changes, maintains all existing props including defensive rendering

---

### 4. Dashboard Layout (Content Area)

**File**: `src/routes/owner/dashboard.tsx`

**Current State:**
- Light gray background (#F1F5F9)
- 24px padding (p-6)
- Inconsistent gaps between sections (mb-6 in some places, no gap in others)
- 2-column grid for cards (md:grid-cols-2)

**Design Changes:**

#### Visual Specifications

| Element | Current | New Specification |
|---------|---------|-------------------|
| Background | bg-[#F1F5F9] | bg-background |
| Main Padding | p-6 (24px) | p-8 (32px) |
| Section Spacing | mb-6 (inconsistent) | space-y-8 (32px consistent) |
| Card Grid Columns | md:grid-cols-2 | md:grid-cols-2 lg:grid-cols-3 (responsive) |
| Card Grid Gap | gap-4 (16px) | gap-6 (24px) |
| Section Header Size | text-[18px] | text-xl (20px) |
| Section Header Weight | font-[600] | font-semibold |
| Section Header Color | text-[#0F1B33] | text-foreground |

#### Layout Structure Refinement

Replace individual `mb-6` classes with a consistent spacing wrapper:

```tsx
<main className="p-8 space-y-8">
  {/* Zone 1: Business Snapshot */}
  <div className="grid gap-6 md:grid-cols-2">
    <StatCard ... />
    <StatCard ... />
  </div>

  {/* Zone 2: Revenue This Month */}
  <StatCard ... />

  {/* Zone 3: Branch Performance */}
  <section className="space-y-4">
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">Branch Performance</h2>
      <p className="text-sm text-muted-foreground">Real-time Status</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {branches.map((branch) => <BranchCard key={branch.id} branch={branch} />)}
    </div>
  </section>

  {/* Additional zones follow same pattern... */}
</main>
```

#### Responsive Grid Behavior

For viewports wider than 1280px, select zones can display 3 columns:

```tsx
// For StatCard grids that can support 3 columns
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```

This applies to:
- Zone 4 (Secondary Row)
- Zone 5 (Approvals Row)

**Interface Stability**: No route or component API changes

---

### 5. Additional Component Styling

#### Header Component

**File**: `src/components/layout/Header.tsx`

Minor updates for consistency (specific implementation to be determined based on current Header structure):
- Background: `bg-card` with `border-b border-border`
- Padding: `px-8 py-4`
- Shadow: `shadow-soft`

#### RevenueChart Component

**File**: `src/components/dashboard/RevenueChart.tsx`

Card wrapper updates (chart library rendering unchanged):
- Card background: `bg-card`
- Border: `border-border`
- Shadow: `shadow-card`
- Border radius: `rounded-xl`
- Padding: `p-6`

#### ActivityItem Component

**File**: `src/components/dashboard/ActivityItem.tsx`

List item styling updates (specific implementation to be determined):
- Background on hover: `hover:bg-muted/30`
- Padding: `p-3`
- Border radius: `rounded-lg`
- Transition: `transition-smooth`

---

## Data Models

No changes to data models. All components maintain their existing prop interfaces and data structures.

---

## Correctness Properties

*Property-based testing is not applicable to this UI styling redesign. The changes are purely visual and do not introduce new behavioral logic that can be verified through universal properties.*

**Testing Strategy:**
- **Visual Regression Testing**: Capture before/after screenshots of dashboard in various states (loading, populated, error)
- **Manual QA**: Verify hover states, focus states, and visual consistency across all components
- **Browser Testing**: Verify rendering in Chrome, Firefox, Safari (desktop only, 1024px+)
- **Component Unit Tests**: Existing tests should continue to pass without modification (no behavioral changes)

---

## Error Handling

No changes to error handling. All components maintain their existing error states and defensive rendering patterns.

**Existing Error States Maintained:**
- Dashboard loading skeleton states
- Branch card defensive rendering for incomplete data
- Dashboard error boundary display

**Visual Updates to Error States:**
- Error container card styling updated to match new card design system
- Retry button styling updated to match interactive element standards

---

## Testing Strategy

### Unit Testing

**Scope**: Verify no regressions in existing functionality

All existing unit tests should pass without modification. If tests rely on specific class names, update assertions to reflect new Tailwind classes while maintaining same component behavior.

**Example Test Updates:**

```typescript
// Before
expect(button).toHaveClass('bg-[#2563EB]');

// After
expect(button).toHaveClass('bg-primary');
```

### Visual Testing

**Approach**: Manual visual QA with documented test cases

**Test Cases:**

1. **Sidebar Navigation**
   - [ ] All navigation items display with proper icons
   - [ ] Active state shows left border accent and background highlight
   - [ ] Hover states transition smoothly (150ms)
   - [ ] User profile section displays correctly at bottom
   - [ ] Focus states show visible ring for keyboard navigation

2. **StatCard Component**
   - [ ] Large metric cards display with proper typography hierarchy
   - [ ] Small metric cards maintain compact sizing
   - [ ] Status badges display with correct colors and opacity
   - [ ] Hover elevation applies only to clickable cards
   - [ ] Skeleton loading states match card dimensions

3. **BranchCard Component**
   - [ ] Status badges (On Target, At Risk, Behind) display correctly
   - [ ] Revenue formatting maintains ₦ symbol and commas
   - [ ] Hover state elevates card with shadow transition
   - [ ] "View Detail" link underlines on hover
   - [ ] Defensive rendering displays skeleton for incomplete data

4. **Dashboard Layout**
   - [ ] Consistent 32px spacing between all major sections
   - [ ] Card grids maintain 24px gaps
   - [ ] 2-column layout at 1024px viewport
   - [ ] 3-column layout at 1280px+ viewport (where applicable)
   - [ ] Section headers maintain consistent styling

5. **Interactive States**
   - [ ] All buttons show hover background changes
   - [ ] All links show hover underlines with 4px offset
   - [ ] Focus rings appear on keyboard navigation (2px width)
   - [ ] Transitions complete in 150-200ms range
   - [ ] Cursor changes to pointer on interactive elements

6. **Color Consistency**
   - [ ] All text uses semantic color tokens (foreground, muted-foreground)
   - [ ] All cards use bg-card background
   - [ ] All borders use border-border color
   - [ ] Status colors match across badges (success, warning, danger)
   - [ ] Sidebar uses sidebar-* color tokens

### Browser Testing

**Target Browsers** (desktop only):
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

**Viewport Sizes to Test:**
- 1024px (minimum supported)
- 1280px (medium desktop)
- 1440px (large desktop)
- 1920px (full HD)

### Integration Testing

**Scope**: Verify dashboard loads correctly with real data

- [ ] Dashboard loads successfully with authenticated user
- [ ] All metrics display actual data values
- [ ] Branch cards render for all branches
- [ ] Revenue chart displays with real monthly data
- [ ] Recent activity list populates
- [ ] Loading states transition to populated states smoothly
- [ ] Error states display if data fetch fails

### Performance Testing

**Metrics to Maintain:**
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- No layout shift from styling changes (CLS = 0)

**Verification:**
- Run Lighthouse audit before and after changes
- Compare bundle size (should be negligible increase from lucide-react icons already installed)

---

## Implementation Plan

### Phase 1: Theme Foundation (30 minutes)

**Tasks:**
1. Review and confirm existing CSS variables in `src/styles.css` meet requirements
2. Add any missing custom utilities (all appear to be present)
3. Create utility class helper function if not already present

**Deliverables:**
- Confirmed theme configuration
- Helper function for className merging (`cn` utility from `clsx` and `tailwind-merge`)

### Phase 2: Sidebar Component (45 minutes)

**Tasks:**
1. Import lucide-react icons and create icon map
2. Update navigation item styling with new classes
3. Implement active state with left border accent
4. Add hover state transitions
5. Update user profile badge styling
6. Test keyboard navigation and focus states

**Deliverables:**
- Updated `src/components/layout/Sidebar.tsx`
- Visual verification of all nav items and states

### Phase 3: Card Components (1 hour)

**Tasks:**
1. Update StatCard with new spacing, typography, and shadow classes
2. Refine badge styling to use semantic color tokens
3. Update BranchCard with consistent card styling
4. Align status badges across both components
5. Test hover states and transitions
6. Verify skeleton loading states match new styling

**Deliverables:**
- Updated `src/components/dashboard/StatCard.tsx`
- Updated `src/components/dashboard/BranchCard.tsx`
- Consistent badge styling across components

### Phase 4: Dashboard Layout (45 minutes)

**Tasks:**
1. Update main content area background and padding
2. Standardize section spacing with `space-y-8`
3. Update card grid gaps and responsive columns
4. Update section header styling
5. Verify responsive behavior at 1024px, 1280px, 1920px

**Deliverables:**
- Updated `src/routes/owner/dashboard.tsx`
- Consistent layout spacing throughout

### Phase 5: Supporting Components (30 minutes)

**Tasks:**
1. Update Header component styling (if needed)
2. Update RevenueChart card wrapper styling
3. Update ActivityItem hover states
4. Update ApprovalButton component styling for consistency
5. Review any other dashboard sub-components

**Deliverables:**
- Updated supporting components
- Visual consistency across all dashboard elements

### Phase 6: Testing and Refinement (1 hour)

**Tasks:**
1. Run existing unit tests and fix any class name assertions
2. Perform visual QA checklist across all states
3. Test keyboard navigation and focus states
4. Test responsive behavior at target viewports
5. Run Lighthouse performance audit
6. Make final adjustments based on findings

**Deliverables:**
- All unit tests passing
- Visual QA checklist completed
- Performance metrics documented
- Screenshot comparison (before/after)

### Total Estimated Time: 4.5 hours

---

## Migration Guide

### For Developers

**Step 1: Review Changes**
- Read this design document thoroughly
- Examine the existing codebase structure
- Note that no component APIs are changing

**Step 2: Implement Changes**
- Follow the implementation plan phases in order
- Test each component after modification
- Use the visual QA checklist to verify changes

**Step 3: Verify Integration**
- Run full dashboard with real data
- Test all interactive states
- Verify responsive behavior
- Confirm no functional regressions

### Common Pitfalls

1. **Color Token Misuse**: Always use semantic tokens (foreground, muted-foreground, primary) rather than hardcoded hex values
2. **Spacing Inconsistency**: Stick to the 8px base system (space-y-2 = 8px, space-y-4 = 16px, etc.)
3. **Border Radius Mismatch**: Use `rounded-xl` (12px) for cards, `rounded-lg` (8px) for smaller elements, `rounded-md` (6px) for badges
4. **Shadow Misuse**: Use `shadow-card` for cards, `shadow-elevated` for hover states, `shadow-soft` for subtle elements
5. **Typography Scale**: Use `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-xl` (20px), `text-4xl` (36px) - avoid arbitrary values

### Rollback Plan

If critical issues arise:
1. All changes are isolated to styling - no API changes
2. Git revert is safe and will restore previous visual appearance
3. No data migrations or schema changes are involved
4. Components maintain backward compatibility

---

## Appendix

### A. Tailwind Class Reference

**Spacing Scale (8px base):**
- `space-y-1` = 4px
- `space-y-2` = 8px
- `space-y-3` = 12px
- `space-y-4` = 16px
- `space-y-6` = 24px
- `space-y-8` = 32px

**Typography Scale:**
- `text-xs` = 12px (captions, badges)
- `text-sm` = 14px (body text, secondary info)
- `text-base` = 16px (primary body text)
- `text-xl` = 20px (section headers)
- `text-2xl` = 24px (small metrics)
- `text-4xl` = 36px (large metrics)

**Border Radius:**
- `rounded-md` = 6px (badges, small buttons)
- `rounded-lg` = 8px (nav items, small cards)
- `rounded-xl` = 12px (main cards)

**Shadows:**
- `shadow-soft` = Subtle shadow for headers
- `shadow-card` = Standard card shadow
- `shadow-elevated` = Hover state shadow

**Colors (Semantic Tokens):**
- `bg-card` = Card backgrounds (white)
- `bg-sidebar` = Sidebar background (navy)
- `bg-muted` = Muted backgrounds
- `text-foreground` = Primary text (dark)
- `text-muted-foreground` = Secondary text (gray)
- `border-border` = Border color (light gray)
- `bg-primary` = Primary action color (blue)
- `bg-success` = Success state (green)
- `bg-warning` = Warning state (yellow/orange)
- `bg-danger` = Error/danger state (red)

### B. Icon Mapping

Lucide-react icons used:

| Function | Icon Component | Size |
|----------|---------------|------|
| Dashboard | LayoutDashboard | 20px |
| Branches | Building2 | 20px |
| Sales | TrendingUp | 20px |
| Targets | Target | 20px |
| Inventory | Package | 20px |
| Products | ShoppingCart | 20px |
| Team | Users | 20px |
| Reports | FileText | 20px |
| Audit Log | History | 20px |
| Settings | Settings | 20px |

### C. Component File Locations

```
src/
  components/
    layout/
      Sidebar.tsx         ← Primary modifications
      Header.tsx          ← Minor styling updates
    dashboard/
      StatCard.tsx        ← Primary modifications
      BranchCard.tsx      ← Primary modifications
      RevenueChart.tsx    ← Card wrapper updates
      ActivityItem.tsx    ← Minor styling updates
      ApprovalButton.tsx  ← Minor styling updates
  routes/
    owner/
      dashboard.tsx       ← Layout spacing updates
  styles.css              ← Theme config (review only)
```

### D. CSS Variable Reference

From `src/styles.css`:

```css
/* Sidebar Colors */
--sidebar: oklch(0.24 0.055 265);              /* Navy background */
--sidebar-foreground: oklch(0.97 0.006 250);   /* Light text */
--sidebar-primary: oklch(0.55 0.22 250);       /* Blue accent */
--sidebar-accent: oklch(0.3 0.05 265);         /* Hover state */

/* Card Colors */
--card: oklch(1 0 0);                          /* White */
--card-foreground: oklch(0.20 0.04 265);       /* Dark text */

/* Semantic Colors */
--success: oklch(0.65 0.15 152);               /* Green */
--warning: oklch(0.75 0.15 78);                /* Yellow */
--danger: oklch(0.60 0.20 25);                 /* Red */

/* Text Colors */
--foreground: oklch(0.20 0.04 265);            /* Primary text */
--muted-foreground: oklch(0.50 0.02 257);      /* Secondary text */

/* Border Colors */
--border: oklch(0.92 0.008 255);               /* Light gray */
```

### E. Before/After Comparison Matrix

| Element | Before | After | Change Type |
|---------|--------|-------|-------------|
| Sidebar width | 256px | 260px | Minor adjustment |
| Nav item padding | 8px vertical | 12px vertical | Spacing |
| Nav item text | 13px | 14px | Typography |
| Card border radius | 8px | 12px | Border radius |
| Card padding | 16px | 24px | Spacing |
| Card shadow | Default | Custom soft | Shadow |
| Metric label | 11px | 12px | Typography |
| Large metric | 34px | 36px | Typography |
| Section spacing | Inconsistent | 32px consistent | Layout |
| Grid gap | 16px | 24px | Spacing |
| Badge padding | 4-8px | 10-16px | Spacing |
| Interactive transition | None/instant | 150ms smooth | Animation |

---

## Conclusion

This design document provides a comprehensive technical specification for transforming the SalesFlow Pro owner dashboard into an enterprise-quality interface. By focusing exclusively on visual improvements through Tailwind CSS refinements, we maintain complete backward compatibility while achieving a professional, polished appearance.

The implementation leverages the existing Tailwind v4 infrastructure, lucide-react icons (already installed), and established design patterns from the current codebase. All changes are non-breaking, isolated to styling, and thoroughly specified with clear visual specifications, component interfaces, and testing requirements.

The phased implementation plan allows for incremental progress with verification at each stage, minimizing risk and ensuring high-quality results.
