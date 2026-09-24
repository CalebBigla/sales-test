# Owner Dashboard Enhancement - Implementation Tasks

**Status**: Ready for Implementation  
**Created**: 2026-09-22  
**Requirements**: [requirements.md](./requirements.md)  
**Design**: [design.md](./design.md)

---

## Task 1: Enhance useBranches Hook with Complete Data Structure
**Priority**: High | **Estimated Effort**: Small  
**Requirements**: REQ-1, REQ-2, REQ-3

### Objective
Update `useBranches` hook to return complete Branch interface with all fields needed for dashboard sections, including computed branch targets.

### Acceptance Criteria
- [ ] Branch interface includes: id, name, color, revenue, salesCount, target, submissionsToday, totalRepsToday
- [ ] Target computed as SUM of rep targets for the branch location (never stored separately)
- [ ] Color assignment uses blue/green palette cycling: #2563EB, #059669, #0EA5E9, #0D9488
- [ ] Mock data includes all 7 fields for testing
- [ ] Hook returns loading/error states appropriately

### Implementation Notes
- File: `src/hooks/useBranches.ts`
- Query `location` table in DB, translate to "Branch" terminology
- Use modulo arithmetic for color cycling: `COLORS[index % COLORS.length]`
- Consider caching strategy for branch target calculations

### Testing
- Verify all 7 Branch fields populated correctly
- Test with 0, 1, 2, and 5+ branches
- Confirm color cycling works for 10+ branches
- Validate target = SUM(rep targets) for each branch

### Demo
Show branch data in console with all fields, demonstrate color cycling with 5+ mock branches.

---

## Task 2: Create useDashboardMetrics Hook
**Priority**: High | **Estimated Effort**: Medium  
**Requirements**: REQ-1, REQ-4, REQ-5

### Objective
Create new data hook to aggregate business-wide metrics from branch data.

### Acceptance Criteria
- [ ] Returns DashboardMetrics interface matching design.md
- [ ] Computes totalRevenue, totalSalesCount, totalTarget from branch data
- [ ] Provides revenueGrowth, inventoryAlerts, pendingSubmissions aggregates
- [ ] Calculates total staff count (Managers + Storekeepers + Sales Reps, excluding Owner)
- [ ] Calculates staff breakdown (X Managers · Y Storekeepers · Z Sales Reps)
- [ ] Includes loading/error states
- [ ] Updates when branch data changes (proper dependencies)

### Implementation Notes
- File: `src/hooks/useDashboardMetrics.ts` (new file)
- Depends on useBranches() output
- Use useMemo for expensive aggregations
- Total staff for Business Snapshot Stat Card (Requirement 1.9-1.11)
- Interface defined in design.md section 5.2

### Testing
- Verify aggregations match manual calculations
- Test with empty branches array
- Confirm reactivity when branch data updates
- Validate null-safe operations for missing targets

### Demo
Display computed metrics in console, show Business Snapshot cards using hook data.

---

## Task 3: Complete Revenue KPI Card Component
**Priority**: High | **Estimated Effort**: Medium  
**Requirements**: REQ-2, REQ-10

### Objective
Enhance existing Revenue card to include progress bar, percentage display, and status badge matching design image.

### Acceptance Criteria
- [ ] Progress bar shows revenue/target with smooth animation
- [ ] Percentage display matches design (bold, prominent)
- [ ] Status badge: "On Target" (green), "At Risk" (amber), "Behind" (red)
- [ ] Handles null/zero target gracefully (shows "No sales recorded yet this month")
- [ ] Never displays revenue without target context

### Implementation Notes
- File: `src/components/dashboard/RevenueCard.tsx` (enhance existing)
- Use useDashboardMetrics() for data
- Progress thresholds: >=100% On Target, 80-99% At Risk, <80% Behind (per Requirement 3.9-3.11)
- Status colors: #059669 (green), #B45309 (amber), #B91C1C (red)
- Animate progress bar with CSS transition
- Display "₦{remaining} remaining" below progress bar

### Testing
- Test with various revenue/target ratios (50%, 79%, 80%, 99%, 100%, 120%)
- Test with zero revenue (display "No sales recorded yet this month")
- Verify status badge logic at threshold boundaries (exactly 80%, exactly 100%)
- Check that revenue is never shown without target context

### Demo
Show Revenue card with live data, demonstrate status badge changes as revenue approaches/exceeds target.

---

## Task 4: Enhance Branch Performance Section
**Priority**: High | **Estimated Effort**: Medium  
**Requirements**: REQ-3, REQ-11

### Objective
Complete Branch Performance section with scrollable grid, status badges, and all branch metrics.

### Acceptance Criteria
- [ ] BranchCard displays all 7 fields: revenue, sales count, target, status, submissions, active reps, accent color
- [ ] Status badge shows "On Target" (>=100%), "At Risk" (80-99%), or "Behind" (<80%) with correct colors
- [ ] Grid layout wraps naturally as branch count increases
- [ ] Section empty state: "Create your first branch →" when zero branches (Requirement 3.17)
- [ ] Per-card empty state: "No target set yet — Set a target →" when branch has zero reps (Requirement 3.15)
- [ ] Per-card empty state: "No sales recorded yet" when branch has zero sales (Requirement 3.16)
- [ ] Loading state: skeleton cards

### Implementation Notes
- Files: `src/components/dashboard/BranchCard.tsx` (enhance), `src/routes/owner/dashboard.tsx`
- Use useBranches() for data
- Apply status logic: >=100% On Target, 80-99% At Risk, <80% Behind (per Requirement 3.9-3.11)
- Grid: natural wrapping layout (not fixed columns)
- Links to `/owner/branches/{branchId}` via "View Detail →" link or full card click

### Testing
- Test with 0, 1, 2, 5+ branches
- Verify status badges at thresholds (79%, 80%, 99%, 100%)
- Test branch with zero reps (shows "No target set yet" empty state)
- Test branch with zero sales (shows "No sales recorded yet" empty state)
- Check grid wrapping behavior

### Demo
Show full Branch Performance section with 3+ branches, different status badges, demonstrate responsive layout and mobile scroll.

---

## Task 5: Create Secondary Metrics Row
**Priority**: Medium | **Estimated Effort**: Small  
**Requirements**: REQ-4

### Objective
Add Secondary Metrics row with Inventory Alerts and Pending Submissions cards.

### Acceptance Criteria
- [ ] Two cards side-by-side: Inventory Alerts (left), Pending Submissions (right)
- [ ] Each card shows icon, title, metric value, and context text
- [ ] Inventory Alerts: alert icon, count, "Requiring attention"
- [ ] Pending Submissions: clock icon, count, "Awaiting review"
- [ ] Cards stack vertically on mobile
- [ ] Empty state shows "0" not "No data"

### Implementation Notes
- Files: `src/components/dashboard/SecondaryMetricsRow.tsx` (new), `src/routes/owner/dashboard.tsx`
- Use useDashboardMetrics() for data
- Icons: AlertTriangle (inventory), Clock (submissions) from lucide-react
- Layout: `grid grid-cols-1 lg:grid-cols-2 gap-4`
- Card styling matches Business Snapshot cards

### Testing
- Test with 0 and non-zero values
- Verify responsive stacking on mobile
- Check icon rendering and colors

### Demo
Show Secondary Metrics row with sample data (5 alerts, 12 submissions), demonstrate mobile stacking.

---

## Task 6: Create Approvals Row
**Priority**: Medium | **Estimated Effort**: Small  
**Requirements**: REQ-5

### Objective
Add Approvals row with Target Requests and Stock Escalations cards showing approval queue counts.

### Acceptance Criteria
- [ ] Two cards side-by-side: Target Requests (left), Stock Escalations (right)
- [ ] Each card shows icon, title, pending count, and action button
- [ ] Target Requests: target icon, count, "Review →" button
- [ ] When Owner clicks "Review →", opens Target_Change_Request list with Sales Rep name, Branch, current target, proposed target, requesting Manager
- [ ] Target_Change_Request list provides "Approve" and "Reject" actions with confirmation modal
- [ ] Stock Escalations: package icon, count, passive red-dot indicator when escalations exist
- [ ] Stock Escalations caption: "HANDLED BY EACH BRANCH'S TEAM"
- [ ] Stock Escalations: visibility only (no approve/reject actions per Requirement 5.15)
- [ ] Cards stack vertically on smaller viewports

### Implementation Notes
- Files: `src/components/dashboard/ApprovalsRow.tsx` (new), `src/routes/owner/dashboard.tsx`
- Use useApprovals() hook (create stub returning mock data)
- Icons: Target (requests), Package (escalations) from lucide-react
- Target Requests opens a modal/drawer list (NOT a new route - per Requirement 5.6-5.9 inline pattern)
- Stock Escalations is display-only with red dot indicator

### Testing
- Test with 0 and non-zero pending counts
- Verify Target Request modal opens with correct data structure
- Verify approval/rejection confirmation flow
- Check that Stock Escalations has no interactive actions

### Demo
Show Approvals row with sample counts (3 requests, 7 escalations), demonstrate link behavior.

---

## Task 7: Create RevenueChart Component
**Priority**: High | **Estimated Effort**: Large  
**Requirements**: REQ-6

### Objective
Build interactive multi-line revenue performance chart using Recharts showing per-branch revenue trends versus combined target line.

### Acceptance Criteria
- [ ] Line chart with one line per Branch using that Branch's assigned Branch_Color from palette
- [ ] One dashed line representing combined Total_Target across all branches
- [ ] Displays data for last 6-12 months (monthly data points)
- [ ] Legend shows each Branch line with colored dot and Branch name
- [ ] Legend shows Target line with dashed swatch and "Target" label
- [ ] Responsive sizing with maintainAspectRatio
- [ ] Tooltips show month, per-branch revenue values, and target on hover
- [ ] Works with 1 branch (single line + target) or N branches
- [ ] Empty state: "No revenue data available for this period"
- [ ] Loading state: skeleton chart placeholder

### Implementation Notes
- Files: `src/components/dashboard/RevenueChart.tsx` (new)
- Use Recharts: LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
- Use useRevenuePerformance() hook (create hook returning monthly time-series data per branch)
- One <Line> component per branch with dataKey matching branch.id, stroke matching branch.color
- Target line: strokeDasharray="5 5", stroke="#94A3B8"
- Chart config per Requirement 6.3-6.7 (multi-line-by-branch, NOT 7-day/30-day toggle)
- Branch colors from Requirement 10 palette: #2563EB, #059669, #0EA5E9, #0D9488

### Testing
- Test with 1 branch (single line + target)
- Test with 2+ branches (multiple colored lines)
- Verify branch colors match assigned Branch_Color from palette
- Check legend rendering with all branch names and target line
- Test empty and loading states

### Demo
Show chart with 2 branches (Yaba blue #2563EB, Ajah green #059669) over 6-month period, demonstrate hover tooltips showing monthly breakdown per branch.

---

## Task 8: Integrate Revenue Performance Chart into Dashboard
**Priority**: High | **Estimated Effort**: Small  
**Requirements**: REQ-6

### Objective
Add Revenue Performance section with chart to dashboard layout.

### Acceptance Criteria
- [ ] Section positioned after Branch Performance, before Recent Activity
- [ ] Section header: "Revenue Performance"
- [ ] Chart fills full width with proper spacing
- [ ] Maintains responsive layout
- [ ] Handles chart loading/error states gracefully

### Implementation Notes
- File: `src/routes/owner/dashboard.tsx`
- Import RevenueChart component
- Section wrapper with consistent spacing: `space-y-6`
- Error boundary around chart component

### Testing
- Verify section positioning in layout
- Check chart responsiveness
- Test error handling if chart fails to load

### Demo
Show complete dashboard with integrated chart section, demonstrate layout flow.

---

## Task 9: Create Recent Activity Feed Component
**Priority**: Medium | **Estimated Effort**: Medium  
**Requirements**: REQ-7, REQ-8

### Objective
Build Recent Activity feed showing last 5 audit log entries with branch-colored avatars and relative timestamps.

### Acceptance Criteria
- [ ] Feed shows 5 most recent product-action audit log entries (per Requirement 7.2)
- [ ] Filters to product actions only: sale logged, stock fulfilled, target updated, target approved, user onboarded, request escalated (Requirement 7.3-7.5)
- [ ] Each entry: relative timestamp, "[Branch_name] {action description}" format, branch-colored avatar dot
- [ ] Avatar dot uses that entry's Branch's Branch_Color from palette (per Requirement 7.8)
- [ ] Timestamps: "Just now", "5 mins ago", "2 hours ago", "Yesterday", or date
- [ ] Defensive rendering handles malformed entries (skip entries missing required fields, log errors)
- [ ] Empty state: "No recent activity to display"
- [ ] Loading state: skeleton items
- [ ] "View all audit log →" link navigates to `/owner/audit-log`

### Implementation Notes
- Files: `src/components/dashboard/RecentActivityFeed.tsx` (new), enhance existing `ActivityItem.tsx`
- Use useRecentActivity() hook (create hook querying audit_log table with product action filter, DESC LIMIT 5)
- Timestamp formatting with date-fns or custom formatter
- Avatar dot component uses branch.color (NOT action-type badge colors - per Requirement 7.8)
- NO badge-by-action-type system (purple Product badges, etc.) - branch-colored dots only
- Defensive: skip entries missing required fields, log errors

### Testing
- Test with 0, 3, 5+ activities
- Verify timestamp formatting (just now, minutes, hours, days)
- Test with malformed entries (missing branch or action fields)
- Verify avatar dots match branch colors from palette
- Confirm only 5 entries display (not 10)

### Demo
Show activity feed with 5 varied activities from different branches, demonstrate branch-colored avatar dots (Yaba blue, Ajah green), show relative timestamps.

---

## Task 10: Integrate Recent Activity into Dashboard
**Priority**: Medium | **Estimated Effort**: Small  
**Requirements**: REQ-7

### Objective
Add Recent Activity section to dashboard layout as final section.

### Acceptance Criteria
- [ ] Section positioned after Revenue Performance (last section)
- [ ] Section header: "Recent Activity"
- [ ] Feed displays correctly with proper spacing
- [ ] Handles loading/error/empty states
- [ ] Maintains overall dashboard scroll behavior

### Implementation Notes
- File: `src/routes/owner/dashboard.tsx`
- Import RecentActivityFeed component
- Section wrapper with consistent spacing
- Consider max-height for feed with internal scroll if needed

### Testing
- Verify section positioning
- Check scroll behavior with long activity list
- Test loading/error states

### Demo
Show complete dashboard with all sections, demonstrate activity feed at bottom.

---

## Task 11: Responsive Layout Polish
**Priority**: Medium | **Estimated Effort**: Small  
**Requirements**: REQ-12

### Objective
Refine responsive behavior for desktop-primary dashboard with graceful degradation to tablet (768px).

### Acceptance Criteria
- [ ] Dashboard optimized for desktop screens 1024px and above (Requirement 12.1)
- [ ] At 768px and below, multi-column rows stack to fewer columns (Requirement 12.2)
- [ ] Revenue Performance chart remains full-width at all viewport sizes (Requirement 12.3)
- [ ] Chart is horizontally scrollable when content exceeds viewport width (Requirement 12.4)
- [ ] Chart never compressed to unreadable size (Requirement 12.5)
- [ ] Consistent spacing across breakpoints

### Implementation Notes
- Files: All dashboard components and main dashboard route
- Breakpoint: 768px (tablet and below stack, desktop 1024+ optimized)
- Desktop-primary design per Requirement 12 and original scope
- NOT mobile-first (375px mobile support explicitly out of scope per "Out of Scope" section)
- Test using browser DevTools responsive mode at 768px and 1024px

### Testing
- Test at 1024px (desktop, primary target)
- Test at 768px (tablet stacking)
- Verify chart horizontal scroll behavior when needed
- Confirm chart maintains readability at all tested sizes

### Demo
Show dashboard at 1024px (optimal), then 768px (stacked layout), demonstrate chart scroll if content exceeds width.

---

## Task 12: Loading, Error, and Empty State Handling
**Priority**: High | **Estimated Effort**: Medium  
**Requirements**: REQ-10, REQ-11

### Objective
Implement section-level loading, error, and empty states for all dashboard sections.

### Acceptance Criteria
- [ ] Each section shows loading skeleton while data fetching
- [ ] Error states show retry button and error message
- [ ] Empty states show helpful messages (not generic "No data")
- [ ] No page-level blocking spinner
- [ ] Sections load independently (no cascade failures)
- [ ] Partial data scenarios handled gracefully

### Implementation Notes
- Files: All dashboard sections and components
- Create reusable ErrorState and EmptyState components
- Use Suspense boundaries where appropriate
- Skeleton components for each card type
- Empty state messages defined in requirements.md

### Testing
- Simulate loading delays for each section
- Test error scenarios (network failure, API error)
- Test empty data scenarios (new account, no branches)
- Verify partial load behavior (some sections succeed, others fail)

### Demo
Show dashboard with staggered loading, demonstrate error state with retry, show empty state for new account.

---

## Task 13: End-to-End Integration Verification
**Priority**: High | **Estimated Effort**: Medium  
**Requirements**: All (REQ-1 through REQ-11)

### Objective
Comprehensive testing of complete dashboard matching design images with real data flows.

### Acceptance Criteria
- [ ] All 7 sections render correctly: Business Snapshot, Revenue KPI, Branch Performance, Secondary Metrics, Approvals, Revenue Chart, Recent Activity
- [ ] Dashboard matches design images (layout, spacing, colors, typography)
- [ ] Dynamic branch support works (0-N branches, no hardcoded Yaba/Ajah)
- [ ] Branch targets computed live as SUM of rep targets
- [ ] Branch colors use blue/green palette only
- [ ] All status badges show correct colors at thresholds
- [ ] Responsive behavior works across all breakpoints
- [ ] Loading/error/empty states work for all sections
- [ ] Performance acceptable (no lag, smooth animations)
- [ ] Console shows no errors or warnings

### Implementation Notes
- Files: Review all modified files
- Test with real database queries (not just mocks)
- Use Chrome DevTools Performance tab to check rendering performance
- Cross-browser testing: Chrome, Firefox, Safari

### Testing
- Test with 0, 1, 3, 10 branches
- Test with varying data scenarios (on target, at risk, behind)
- Test with empty audit log
- Test with slow network (Chrome DevTools throttling)
- Test responsive behavior on real devices
- Regression test: verify existing functionality still works

### Demo
Complete walkthrough of dashboard with real data, demonstrate all interactive features, show responsive behavior, verify against design images.

---

## Implementation Order

**Phase 1 - Data Foundation** (Tasks 1-2)
1. Task 1: Enhance useBranches Hook
2. Task 2: Create useDashboardMetrics Hook

**Phase 2 - Core Sections** (Tasks 3-4)
3. Task 3: Complete Revenue KPI Card
4. Task 4: Enhance Branch Performance Section

**Phase 3 - Supporting Sections** (Tasks 5-6)
5. Task 5: Create Secondary Metrics Row
6. Task 6: Create Approvals Row

**Phase 4 - Data Visualization** (Tasks 7-8)
7. Task 7: Create RevenueChart Component (multi-line per branch)
8. Task 8: Integrate Chart into Dashboard

**Phase 5 - Activity Feed** (Tasks 9-10)
9. Task 9: Create Recent Activity Feed (5 entries with branch-colored dots)
10. Task 10: Integrate Activity into Dashboard

**Phase 6 - Polish & Verification** (Tasks 11-13)
11. Task 11: Responsive Layout Polish (desktop-primary, 768px+ only)
12. Task 12: Loading, Error, Empty State Handling (section-level states)
13. Task 13: End-to-End Integration Verification

---

## Notes

- **Incremental Approach**: Tasks build on existing dashboard, not rebuild from scratch
- **Current State**: Dashboard has Business Snapshot cards and partial Revenue card
- **Dependencies**: Tasks 3-13 depend on Tasks 1-2 completing first
- **Testing Strategy**: Each task includes unit-level testing, Task 13 provides integration testing
- **Design Reference**: All UI decisions reference design.md and provided design images
- **Database Schema**: Query `location` table, translate to "Branch" in UI layer
- **Color Palette**: Limited to blue/green tones per design constraints
- **Desktop-Primary**: Dashboard optimized for 1024px+ per Requirement 12, NOT mobile-first
- **Business Snapshot**: Two cards only (Total Branches, Total Staff per Requirement 1.2-1.12)
- **Status Thresholds**: >=100% On Target, 80-99% At Risk, <80% Behind (per Requirement 3.9-3.11)
- **Recent Activity Count**: 5 entries (per Requirement 7.2), NOT 10
- **Chart Design**: Multi-line per branch with colors from palette, monthly data (per Requirement 6.3-6.7), NOT 7-day/30-day toggle
- **Activity Avatars**: Branch-colored dots only (per Requirement 7.8), NOT action-type badges

## Files Modified (Estimated)

**New Files** (8):
- `src/hooks/useDashboardMetrics.ts`
- `src/hooks/useApprovals.ts`
- `src/hooks/useRevenuePerformance.ts`
- `src/hooks/useRecentActivity.ts`
- `src/components/dashboard/SecondaryMetricsRow.tsx`
- `src/components/dashboard/ApprovalsRow.tsx`
- `src/components/dashboard/RevenueChart.tsx`
- `src/components/dashboard/RecentActivityFeed.tsx`

**Enhanced Files** (4):
- `src/hooks/useBranches.ts`
- `src/components/dashboard/BranchCard.tsx`
- `src/components/dashboard/RevenueCard.tsx`
- `src/routes/owner/dashboard.tsx`

**Total**: 12 files (8 new, 4 enhanced)
