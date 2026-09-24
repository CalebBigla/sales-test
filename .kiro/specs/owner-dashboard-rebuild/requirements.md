# Requirements Document: Business Owner Dashboard

## Introduction

The Business Owner Dashboard provides the business owner of SalesFlow Pro with a comprehensive real-time view of their multi-branch distribution business. The dashboard aggregates data across all branches (dynamically created, not hardcoded), displays key performance indicators including revenue, targets, inventory health, staff performance, and pending approvals, and provides drill-down navigation to detailed management screens.

SalesFlow Pro operates with multiple branches (currently 2: Yaba and Ajah, but must support 0 to N branches dynamically). Each branch has its own Manager, Storekeeper, and Sales Reps, with separate stock. Sales Reps have individual monthly targets. Branch targets are computed live as the sum of individual rep targets, never stored separately.

## Glossary

- **Owner**: The business owner role with access to cross-branch analytics and approval workflows
- **Branch**: A physical location (stored as `location` table in database) with its own staff and inventory
- **Dashboard**: The `/owner/dashboard` route displaying business metrics and status
- **Sales_Rep**: A user with the sales representative role who logs daily sales and has individual monthly targets
- **Manager**: A branch-level user role responsible for local operations and target proposals
- **Storekeeper**: A branch-level user role responsible for inventory management
- **Revenue**: Total sales amount in Naira (₦) for a given period
- **Target**: The monthly sales goal amount in Naira (₦)
- **Branch_Target**: The sum of all Sales Rep targets for a specific branch, computed live
- **Total_Target**: The sum of all Sales Rep targets across all branches, computed live
- **Submission**: A daily sales report submitted by a Sales Rep
- **Status_Badge**: A visual indicator showing target achievement level (On Target ≥100%, At Risk 80-99%, Behind <80%)
- **Stat_Card**: A compact card component displaying a single metric with caption and optional link
- **Branch_Card**: A card component displaying branch-specific performance metrics
- **Low_Stock_Product**: A product whose current inventory level has fallen below its defined threshold
- **Target_Change_Request**: A Manager-proposed modification to a Sales Rep's monthly target awaiting Owner approval
- **Stock_Escalation**: A stock request that has remained unactioned for more than 4 hours
- **Audit_Log_Entry**: A recorded system event showing user actions with timestamp and branch context
- **useBranches_Hook**: A React hook that queries the `location` table and returns branch data with computed metrics
- **Branch_Color**: A display color assigned to each branch from a predefined palette for chart visualization and activity avatars
- **Empty_State**: A deliberate UI state for legitimate absence of data (new tenant, new branch, no activity)
- **Loading_State**: A UI state showing skeleton loaders while data is being fetched
- **Error_State**: A UI state showing error message and retry action when data fetch fails

## Requirements

### Requirement 1: Business Snapshot Display

**User Story:** As an Owner, I want to see total branch count and total staff count at a glance, so that I understand the scale of my organization immediately upon opening the dashboard.

#### Acceptance Criteria

1. WHEN the Owner opens the Dashboard, THE Dashboard SHALL display a Business Snapshot strip above the Revenue card
2. THE Business Snapshot strip SHALL contain two Stat Cards positioned side by side
3. THE first Stat Card SHALL display "TOTAL BRANCHES" as the label
4. THE first Stat Card SHALL display the current branch count retrieved from useBranches_Hook
5. THE first Stat Card SHALL display a muted caption listing all Branch names
6. WHEN the branch count exceeds 5, THE first Stat Card SHALL truncate the Branch names list with ellipsis
7. THE first Stat Card SHALL link to `/owner/branches` route
8. THE second Stat Card SHALL display "TOTAL STAFF" as the label
9. THE second Stat Card SHALL display the count of Managers plus Storekeepers plus Sales Reps across all branches
10. THE second Stat Card SHALL exclude the Owner from the staff count
11. THE second Stat Card SHALL display a breakdown caption formatted as "X Managers · Y Storekeepers · Z Sales Reps"
12. THE second Stat Card SHALL link to `/owner/team` route
13. THE Business Snapshot Stat Cards SHALL use approximately 24 pixel font size for numbers
14. IF the branch count is zero, THEN THE first Stat Card SHALL display "Create your first branch →" prompt instead of "0"

### Requirement 2: Revenue KPI Display

**User Story:** As an Owner, I want to see total revenue across all branches with progress toward the total target, so that I understand whether my business is on track to meet its monthly goals.

#### Acceptance Criteria

1. WHEN the Dashboard loads with at least one Branch having sales data, THE Dashboard SHALL display a Revenue card
2. THE Revenue card SHALL display "REVENUE THIS MONTH" as the title
3. THE Revenue card SHALL display the current total Revenue amount in Naira (₦) aggregated across all branches
4. THE Revenue card SHALL calculate Total_Target as the sum of all Sales Rep targets across all branches
5. THE Revenue card SHALL calculate the percentage of Total_Target achieved
6. THE Revenue card SHALL display a subtitle formatted as "{percentage}% of ₦{Total_Target} target"
7. THE Revenue card SHALL display a horizontal progress bar filled to the calculated percentage
8. THE Revenue card SHALL calculate the remaining amount as Total_Target minus current Revenue
9. THE Revenue card SHALL display "₦{remaining} remaining" below the progress bar
10. IF the total Revenue is zero for the current month, THEN THE Revenue card SHALL display "No sales recorded yet this month" instead of "₦0"
11. THE Revenue card SHALL never display Revenue without its target context

### Requirement 3: Branch Performance Section Display

**User Story:** As an Owner, I want to see individual branch performance metrics in separate cards, so that I can quickly identify which branches are performing well and which need attention.

#### Acceptance Criteria

1. WHEN the Dashboard has one or more branches, THE Dashboard SHALL render a "Branch Performance" section
2. THE Branch Performance section SHALL display "Branch Performance" as H2 heading
3. THE Branch Performance section SHALL display "Real-time Status" as a muted caption below the heading
4. THE Branch Performance section SHALL render one Branch_Card per Branch
5. THE Branch_Cards SHALL be laid out to wrap naturally as branch count increases
6. WHEN a Branch has at least one Sales Rep with a target, THE Branch_Card SHALL calculate Branch_Target as the sum of that Branch's Sales Rep targets
7. THE Branch_Card SHALL display the Branch name
8. THE Branch_Card SHALL calculate the Branch achievement percentage as Branch Revenue divided by Branch_Target multiplied by 100
9. WHEN the achievement percentage is greater than or equal to 100%, THE Branch_Card SHALL display a green Status_Badge labeled "On Target"
10. WHEN the achievement percentage is between 80% and 99% inclusive, THE Branch_Card SHALL display an amber Status_Badge labeled "At Risk"
11. WHEN the achievement percentage is less than 80%, THE Branch_Card SHALL display a red Status_Badge labeled "Behind"
12. THE Branch_Card SHALL display "₦{Branch Revenue} of ₦{Branch_Target}" text
13. THE Branch_Card SHALL display "TODAY'S SUBMISSIONS: {submitted count}/{total Sales Rep count} REPS" as a caption
14. THE Branch_Card SHALL link to `/owner/branches/{branchId}` route via "View Detail →" link or full card click
15. IF a Branch has zero Sales Reps, THEN THE Branch_Card SHALL display "No target set yet — Set a target →" empty state
16. IF a Branch has zero sales for the current period, THEN THE Branch_Card SHALL display "No sales recorded yet" empty state
17. IF there are zero branches, THEN THE Branch Performance section SHALL display an empty state with "Create your first branch →" call to action

### Requirement 4: Secondary Metrics Display

**User Story:** As an Owner, I want to see inventory health and daily submission rates across all branches, so that I can identify operational issues that need attention.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display a Secondary Metrics row
2. THE Secondary Metrics row SHALL contain two cards positioned side by side
3. THE first card SHALL display "INVENTORY HEALTH" as the title
4. THE first card SHALL calculate the count of Low_Stock_Products aggregated across all branches
5. THE first card SHALL display the count formatted as "{count} products need attention across {branch count} branches"
6. THE first card SHALL link to `/owner/inventory` route
7. THE second card SHALL display "DAILY SUBMISSIONS" as the title
8. THE second card SHALL calculate the org-wide submission rate as submitted count divided by total Sales Rep count multiplied by 100
9. THE second card SHALL display the rate formatted as "{percentage}% org-wide ({submitted}/{total})"
10. THE second card SHALL identify Sales Reps who have not submitted for the current day
11. WHEN up to 3 Sales Reps have not submitted, THE second card SHALL display all their names
12. WHEN more than 3 Sales Reps have not submitted, THE second card SHALL display the first 3 names followed by "…"
13. THE second card SHALL link to `/owner/team` route

### Requirement 5: Approvals Row Display

**User Story:** As an Owner, I want to see pending target change requests and stock escalations in one place, so that I can take action on items requiring my approval or awareness.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display an Approvals row
2. THE Approvals row SHALL contain two cards positioned side by side
3. THE first card SHALL display "TARGET CHANGE REQUESTS" as the title
4. THE first card SHALL calculate the count of Manager-proposed Target_Change_Requests awaiting Owner approval across all branches
5. THE first card SHALL display a blue "Review →" button
6. WHEN the Owner clicks the "Review →" button, THE Dashboard SHALL open a list of Target_Change_Requests
7. THE Target_Change_Request list SHALL display Sales Rep name, Branch, current target, proposed target, and requesting Manager for each request
8. THE Target_Change_Request list SHALL provide "Approve" and "Reject" actions for each request
9. WHEN the Owner clicks "Approve" or "Reject", THE Dashboard SHALL display a confirmation modal before executing the action
10. THE second card SHALL display "STOCK ESCALATIONS" as the title
11. THE second card SHALL calculate the count of stock requests unactioned for more than 4 hours across all branches
12. THE second card SHALL tag each Stock_Escalation by its Branch
13. THE second card SHALL display "HANDLED BY EACH BRANCH'S TEAM" as a caption
14. THE second card SHALL display a passive red-dot indicator when Stock_Escalations exist
15. THE second card SHALL not provide approve or reject actions (visibility only)

### Requirement 6: Revenue Performance Chart Display

**User Story:** As an Owner, I want to see revenue trends over time for each branch compared to target, so that I can understand historical performance patterns and make informed decisions.

#### Acceptance Criteria

1. WHEN the Dashboard has at least one Branch with revenue history, THE Dashboard SHALL render a Revenue Performance chart
2. THE Revenue Performance chart SHALL display as a full-width line chart
3. THE Revenue Performance chart SHALL display one line per Branch using that Branch's assigned Branch_Color
4. THE Revenue Performance chart SHALL display one dashed line representing the combined Total_Target
5. THE Revenue Performance chart SHALL display data for the last 6 to 12 months
6. THE Revenue Performance chart SHALL display a legend showing each Branch line with a colored dot and Branch name
7. THE Revenue Performance chart SHALL display the Target line in the legend with a dashed swatch and "Target" label
8. WHEN there is only one Branch, THE Revenue Performance chart SHALL render with a single Branch line plus the Target line

### Requirement 7: Recent Activity Display

**User Story:** As an Owner, I want to see the most recent system activities tagged by branch, so that I stay informed about important events across my organization.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display a Recent Activity section
2. THE Recent Activity section SHALL display the 5 most recent Audit_Log_Entry records
3. THE Dashboard SHALL retrieve Audit_Log_Entry records filtered to product actions only
4. THE product actions filter SHALL include: sale logged, stock request fulfilled, target updated, target approved, user onboarded, request escalated
5. THE Dashboard SHALL exclude non-product actions from the Recent Activity section
6. THE Recent Activity section SHALL display each Audit_Log_Entry tagged with its Branch name formatted as "[Branch_name] {action description}"
7. THE Recent Activity section SHALL display a relative timestamp for each Audit_Log_Entry
8. THE Recent Activity section SHALL display a Branch-colored avatar or dot for each Audit_Log_Entry using that Branch's Branch_Color
9. THE Recent Activity section SHALL display a "View all audit log →" link
10. THE "View all audit log →" link SHALL navigate to `/owner/audit-log` route

### Requirement 8: Loading, Error, and Empty State Handling

**User Story:** As an Owner, I want to see appropriate feedback when data is loading, when errors occur, or when data is legitimately empty, so that I understand the system status and can take appropriate action.

#### Acceptance Criteria

1. WHEN any section's data is being fetched, THE Dashboard SHALL display a Loading_State for that section only
2. THE Loading_State SHALL display skeleton loaders shaped like the section's real content
3. THE Dashboard SHALL never display a single page-level spinner blocking the entire Dashboard
4. WHEN any section's data fetch fails, THE Dashboard SHALL display an Error_State for that section only
5. THE Error_State SHALL display a plain-language error message
6. THE Error_State SHALL provide a retry action scoped to that section only
7. WHEN any section's data has loaded but is legitimately empty, THE Dashboard SHALL display an Empty_State for that section
8. THE Empty_State SHALL display section-specific empty-state copy as defined in Requirements 1-7
9. THE Empty_State SHALL be visually distinct from both Loading_State and Error_State
10. THE Dashboard SHALL never render an Empty_State as a crash, undefined value, or broken-looking zero

### Requirement 9: Data Contract Definition

**User Story:** As a developer, I want a standardized data interface for branch data, so that the Dashboard components can reliably consume branch information regardless of the number of branches.

#### Acceptance Criteria

1. THE useBranches_Hook SHALL query the `location` database table
2. THE useBranches_Hook SHALL return an array of branch objects
3. THE useBranches_Hook SHALL work identically for 0, 1, 2, or N branches
4. THE Dashboard code SHALL never contain hardcoded branch names
5. THE Dashboard code SHALL never contain hardcoded branch counts
6. THE branch object SHALL contain an `id` property of type string or number
7. THE branch object SHALL contain a `name` property of type string
8. THE branch object SHALL contain a `color` property of type string representing a hex color code
9. THE branch object SHALL contain a `revenue` property of type number representing current month revenue
10. THE branch object SHALL contain a `target` property of type number representing the sum of Sales Rep targets for that Branch
11. THE branch object SHALL contain a `salesCount` property of type number representing total sales transactions
12. THE branch object SHALL contain a `submissionsToday` property of type number representing Sales Reps who submitted today
13. THE branch object SHALL contain a `totalRepsToday` property of type number representing total Sales Reps for that Branch
14. WHEN used in local development or testing, THE useBranches_Hook MAY return seed data representing 2 branches
15. THE seed data for Yaba branch SHALL show revenue 1,850,000, target 2,000,000, submissions 4 of 5
16. THE seed data for Ajah branch SHALL show revenue 1,200,000, target 1,800,000, submissions 2 of 6

### Requirement 10: Branch Color Assignment

**User Story:** As a developer, I want each branch to have a consistent display color from a predefined palette, so that chart lines and activity indicators are visually consistent and distinguishable.

#### Acceptance Criteria

1. WHEN a Branch is created or seeded, THE System SHALL assign a Branch_Color from a predefined palette
2. THE predefined palette SHALL be limited to blue and green tones only
3. THE first Branch SHALL be assigned Branch_Color #2563EB (blue)
4. THE second Branch SHALL be assigned Branch_Color #059669 (green)
5. THE third Branch SHALL be assigned Branch_Color #0EA5E9 (sky blue accent)
6. THE fourth Branch SHALL be assigned Branch_Color #0D9488 (teal/blue-green blend)
7. WHEN more than 4 branches exist, THE System SHALL cycle through the palette starting from the first color
8. THE Branch_Color SHALL be used for chart lines in the Revenue Performance chart
9. THE Branch_Color SHALL be used for activity-feed avatar dots in the Recent Activity section
10. THE Branch_Color SHALL never be confused with Status_Badge colors (green/amber/red)
11. THE Status_Badge colors SHALL remain strictly semantic and defined in Requirement 3

### Requirement 11: Design Token Compliance

**User Story:** As a developer, I want all Dashboard components to use standardized design tokens, so that the interface is visually consistent with the rest of the application.

#### Acceptance Criteria

1. THE Dashboard SHALL use color #0F1B33 (navy) for sidebar elements
2. THE Dashboard SHALL use color #2563EB (blue) for accent elements
3. THE Dashboard SHALL use color #334155 (slate) for body text
4. THE Dashboard SHALL use color #64748B (muted) for caption text
5. THE Dashboard SHALL use color #F1F5F9 (light) for background elements
6. THE Dashboard SHALL use color #E5E9F0 for primary borders
7. THE Dashboard SHALL use color #CBD5E1 for secondary borders
8. THE Dashboard SHALL use color #059669 (green) for Status_Badge "On Target" only
9. THE Dashboard SHALL use color #B45309 (amber) for Status_Badge "At Risk" only
10. THE Dashboard SHALL use color #B91C1C (red) for Status_Badge "Behind" only
11. THE Dashboard SHALL never use status colors decoratively
12. THE Dashboard SHALL always pair status colors with a text label

### Requirement 12: Responsive Layout

**User Story:** As an Owner, I want the Dashboard to work well on different screen sizes, so that I can view business metrics on desktop and tablet devices.

#### Acceptance Criteria

1. THE Dashboard SHALL be optimized for desktop screens at 1024 pixels width and above
2. WHEN the viewport width is 768 pixels or less, THE Dashboard SHALL stack multi-column rows to fewer columns
3. THE Revenue Performance chart SHALL remain full-width at all viewport sizes
4. WHEN the Revenue Performance chart content exceeds viewport width, THE chart SHALL be horizontally scrollable
5. THE Dashboard SHALL never compress the Revenue Performance chart to an unreadable size

### Requirement 13: Component Reusability

**User Story:** As a developer, I want Dashboard components to be reusable and well-structured, so that similar UI patterns can be used elsewhere in the application.

#### Acceptance Criteria

1. THE Dashboard SHALL implement a reusable Stat_Card component
2. THE Dashboard SHALL implement a reusable Branch_Card component
3. THE Dashboard SHALL implement a reusable RevenueChart component
4. THE Dashboard SHALL implement a reusable ActivityItem component
5. THE reusable components SHALL accept props for customization
6. THE reusable components SHALL be usable outside the Dashboard context

## Notes

### Out of Scope
- The "Create Branch" form and workflow (separate task)
- Migrating the `location` database schema (separate task)
- Leads, deals, or sales pipeline UI features
- Mobile-specific responsive layouts (below 768px)
- Real-time WebSocket updates (future enhancement)

### Implementation Priorities
1. Core data hooks (useBranches, useStaff, useRevenue)
2. Business Snapshot and Revenue KPI cards
3. Branch Performance section with status badges
4. Secondary metrics and approvals rows
5. Revenue Performance chart
6. Recent Activity feed
7. Loading/error/empty state handling
8. Responsive layout refinements

### Testing Considerations
- Test with 0, 1, 2, and 5+ branches to verify dynamic behavior
- Test with zero sales data (new tenant scenario)
- Test with missing or incomplete data (error scenarios)
- Test status badge calculations at boundary conditions (exactly 80%, exactly 100%)
- Test branch color cycling beyond 4 branches
