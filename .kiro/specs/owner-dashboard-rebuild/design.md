# Owner Dashboard Quality Issues Bugfix Design

## Overview

This design addresses six quality issues in the Owner Dashboard implementation that prevent it from matching the requirements specification. The issues include broken Tailwind dynamic className patterns, hardcoded mock data instead of computed aggregates, typography inconsistency, hardcoded branch logic, and missing functionality. The fix will ensure the dashboard displays real computed data, uses proper Tailwind patterns, maintains correct typography, and properly utilizes branch properties.

## Glossary

- **Bug_Condition (C)**: The condition that triggers rendering or data issues - when specific components use broken Tailwind patterns, hardcoded values, or incorrect properties
- **Property (P)**: The desired behavior - components should use proper Tailwind classes, computed data from hooks, correct typography, and branch.color property
- **Preservation**: Existing dashboard layout, navigation, loading states, and error handling that must remain unchanged
- **StatCard**: The reusable card component in `src/components/dashboard/StatCard.tsx` that displays metrics
- **BranchCard**: The reusable card component in `src/components/dashboard/BranchCard.tsx` that displays branch performance
- **Status_Badge**: Visual indicator showing target achievement level (On Target ≥100%, At Risk 80-99%, Behind <80%)
- **useBranches**: Hook in `src/hooks/useBranches.ts` that provides branch data including color property
- **useDashboardData**: Hook in `src/hooks/useDashboardData.ts` that provides organization-level metrics
- **useDashboardMetrics**: Missing hook that should compute revenue and metric aggregates from branch data
- **Dynamic className**: Tailwind pattern `bg-[${variable}]/20` that doesn't work because Tailwind requires static class names at build time
- **Branch.color**: The color property on each Branch object (e.g., "#2563EB" for Yaba, "#059669" for Ajah)

## Bug Details

### Bug Condition

The bugs manifest in six distinct scenarios across the owner dashboard components. Each scenario represents a different type of rendering or data issue that prevents the dashboard from meeting its requirements.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: string, issue: string }
  OUTPUT: boolean
  
  RETURN (input.component == "StatCard" AND input.issue == "dynamic-classname")
         OR (input.component == "BranchCard" AND input.issue == "dynamic-classname")
         OR (input.component == "StatCard" AND input.issue == "wrong-font-size")
         OR (input.component == "BranchCard" AND input.issue == "hardcoded-color")
         OR (input.component == "dashboard" AND input.issue == "hardcoded-data")
         OR (input.component == "dashboard" AND input.issue == "missing-revenue-badge")
END FUNCTION
```

### Examples

- **Issue 1**: StatCard status badges render with unstyled text because `bg-[${bgColor}]/20` doesn't compile to actual CSS classes (Tailwind needs static strings)
- **Issue 2**: BranchCard status badges have the same issue with dynamic className pattern
- **Issue 3**: Business Snapshot cards (Total Branches, Total Staff) use 34px font size when requirements specify 24px for these specific cards
- **Issue 4**: BranchCard determines branch color with `branch.name.toLowerCase() === "yaba" ? "#2563EB" : "#059669"` instead of using `branch.color` property
- **Issue 5**: Dashboard displays hardcoded values like "₦3,050,000" and "80%" instead of computing from useDashboardMetrics
- **Issue 6**: Revenue card lacks a status badge (On Target/At Risk/Behind) that other metric cards have

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Dashboard layout and zone structure (7 zones) must remain unchanged
- All navigation links and routing must continue to work exactly as before
- Loading states with skeleton loaders must remain unchanged
- Error handling and retry mechanisms must remain unchanged
- All other cards and components not mentioned in the six issues must remain unchanged
- Responsive grid layout and card arrangements must remain unchanged
- Sidebar, Header, and page structure must remain unchanged

**Scope:**
All dashboard functionality that does NOT involve status badge rendering, font sizes, branch colors, revenue computation, or the six specific issues should be completely unaffected by this fix. This includes:
- Activity feed display and formatting
- Chart rendering logic
- Navigation and routing
- Loading and error states
- Other dashboard sections not mentioned

## Hypothesized Root Cause

Based on the bug descriptions and code analysis, the most likely issues are:

1. **Tailwind JIT Compilation Limitation**: The dynamic className pattern `bg-[${bgColor}]/20 text-[${bgColor}]` doesn't work because Tailwind's JIT compiler scans files at build time for static class names. Template literals with variables are not recognized as valid classes, so they're not generated in the final CSS bundle.

2. **Missing useDashboardMetrics Hook**: The dashboard uses hardcoded values because no hook exists to compute aggregated metrics from branch data. The useDashboardData hook provides mock data but not computed aggregates.

3. **Typography Implementation Error**: The StatCard component uses a single font size (34px) for all values, but requirements specify different sizes for different card types (24px for Business Snapshot, 34px for Revenue).

4. **Branch Color Logic Error**: BranchCard hardcodes branch colors based on name checks instead of reading the `branch.color` property that already exists in the Branch interface from useBranches.

5. **Incomplete Requirements Implementation**: The Revenue card was implemented without the status badge feature that other metric cards have, despite requirements indicating all major metrics should show target achievement status.

6. **Component API Design Gap**: StatCard and BranchCard need to support multiple badge rendering approaches (static classes, conditional rendering, or a mapping function) instead of dynamic template literals.

## Correctness Properties

Property 1: Bug Condition - Status Badges Render Correctly

_For any_ component that displays a status badge (On Target/At Risk/Behind), the fixed components SHALL use conditional className assignment with static Tailwind classes (e.g., `bg-emerald-600/20` for green, `bg-amber-700/20` for amber, `bg-red-700/20` for red) instead of template literal injection, causing the badges to render with proper background colors and text colors.

**Validates: Requirements 3.9, 3.10, 3.11 (Status badge display)**

Property 2: Bug Condition - Typography Matches Specification

_For any_ Business Snapshot card (Total Branches, Total Staff), the fixed StatCard component SHALL render values with 24px font size instead of 34px, while Revenue and other major metrics SHALL continue using 34px font size, matching the design specification.

**Validates: Requirement 1.13 (Business Snapshot font size)**

Property 3: Bug Condition - Branch Colors Use Properties

_For any_ BranchCard displaying branch information, the fixed component SHALL read the color from `branch.color` property instead of using hardcoded name checks, allowing dynamic branch color assignment to work correctly.

**Validates: Requirements 10.8, 10.9 (Branch color usage)**

Property 4: Bug Condition - Revenue Displays Computed Data

_For any_ dashboard render, the fixed dashboard SHALL display revenue and target values computed by useDashboardMetrics hook (summing branch revenues and targets) instead of hardcoded "₦3,050,000" and "80%" strings, showing real-time accurate data.

**Validates: Requirements 2.3, 2.4, 2.5 (Revenue aggregation and display)**

Property 5: Bug Condition - Revenue Card Shows Status Badge

_For any_ dashboard render where total target exists, the fixed Revenue card SHALL display a status badge (On Target ≥100%, At Risk 80-99%, Behind <80%) similar to BranchCard badges, providing at-a-glance achievement status.

**Validates: Requirement 2 (Revenue KPI Display with status indication)**

Property 6: Preservation - Dashboard Layout and Structure

_For any_ dashboard section not directly involved in the six bug fixes (Activity feed, Chart, Approvals, Inventory, Loading states, Error states, Navigation), the fixed dashboard SHALL produce exactly the same rendered output and behavior as the original dashboard, preserving all existing functionality.

**Validates: Requirements 8 (Loading/Error states), 12 (Responsive layout), 13 (Component reusability)**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `src/components/dashboard/StatCard.tsx`

**Function**: Badge rendering logic and typography

**Specific Changes**:
1. **Replace Dynamic className Pattern**: Remove the template literal `bg-[${bgColor}]/20 text-[${bgColor}]` and replace with conditional className assignment:
   ```typescript
   const badgeClassName = badge.color === "green"
     ? "inline-flex items-center space-x-1 text-[10px] font-[600] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-600"
     : badge.color === "amber"
     ? "inline-flex items-center space-x-1 text-[10px] font-[600] px-2 py-0.5 rounded bg-amber-700/20 text-amber-700"
     : "inline-flex items-center space-x-1 text-[10px] font-[600] px-2 py-0.5 rounded bg-red-700/20 text-red-700";
   ```

2. **Add Font Size Variant Prop**: Add optional `size` prop to StatCard interface to support different value font sizes:
   ```typescript
   interface StatCardProps {
     // ... existing props
     size?: "small" | "large"; // small = 24px, large = 34px (default)
   }
   ```

3. **Apply Conditional Font Size**: Update the value rendering to use the size prop:
   ```typescript
   <p className={`font-[700] text-[#0F1B33] ${size === "small" ? "text-[24px]" : "text-[34px]"}`}>
     {value}
   </p>
   ```

**File 2**: `src/components/dashboard/BranchCard.tsx`

**Function**: Status badge rendering and branch color usage

**Specific Changes**:
1. **Replace Dynamic className Pattern**: Remove the template literal badge className and replace with conditional assignment (same as StatCard fix above)

2. **Use branch.color Property**: Remove the hardcoded name check:
   ```typescript
   // REMOVE:
   const branchColor = branch.name.toLowerCase() === "yaba" ? "#2563EB" : "#059669";
   
   // REPLACE WITH:
   // Branch color is now read directly from branch.color property
   ```

3. **Remove Unused branchColor Variable**: Delete the `branchColor` variable entirely since it's not actually used in the component (avatar/dot rendering is not yet implemented)

**File 3**: `src/hooks/useDashboardMetrics.ts` (NEW FILE)

**Function**: Compute aggregated revenue and target metrics from branch data

**Specific Changes**:
1. **Create New Hook File**: Create `src/hooks/useDashboardMetrics.ts`

2. **Implement Aggregation Logic**: 
   ```typescript
   import { useMemo } from "react";
   import { Branch } from "./useBranches";

   export function useDashboardMetrics(branches: Branch[]) {
     return useMemo(() => {
       const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);
       const totalTarget = branches.reduce((sum, b) => sum + (b.target || 0), 0);
       const percentage = totalTarget > 0 ? Math.round((totalRevenue / totalTarget) * 100) : 0;
       const remaining = totalTarget - totalRevenue;
       
       return {
         totalRevenue,
         totalTarget,
         percentage,
         remaining,
       };
     }, [branches]);
   }
   ```

3. **Export Metrics Interface**: Define return type for type safety

**File 4**: `src/routes/owner/dashboard.tsx`

**Function**: Dashboard page component

**Specific Changes**:
1. **Import useDashboardMetrics Hook**: Add import for the new hook

2. **Call useDashboardMetrics**: Add hook call to compute metrics from branch data:
   ```typescript
   const metrics = useDashboardMetrics(branches);
   ```

3. **Replace Hardcoded Revenue Values**: Update Revenue card to use computed values:
   ```typescript
   <StatCard
     label="REVENUE THIS MONTH"
     value={`₦${metrics.totalRevenue.toLocaleString()}`}
     caption={`${metrics.percentage}% of ₦${metrics.totalTarget.toLocaleString()} target`}
     badge={
       metrics.percentage >= 100
         ? { text: "On Target", color: "green" }
         : metrics.percentage >= 80
         ? { text: "At Risk", color: "amber" }
         : { text: "Behind", color: "red" }
     }
     className="flex flex-col items-start"
   >
     {/* Progress bar implementation */}
   </StatCard>
   ```

4. **Update Business Snapshot Cards**: Add `size="small"` prop to Total Branches and Total Staff cards:
   ```typescript
   <StatCard
     label="TOTAL BRANCHES"
     value={branches.length}
     size="small"
     // ... other props
   />
   <StatCard
     label="TOTAL STAFF"
     value={data.totalStaff}
     size="small"
     // ... other props
   />
   ```

5. **Update Progress Bar Remaining Amount**: Use computed remaining value:
   ```typescript
   <div className="mt-2 text-[12px] font-[400] text-[#64748B] text-right">
     ₦{metrics.remaining.toLocaleString()} remaining
   </div>
   ```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Inspect the rendered dashboard in a browser with developer tools to observe badge rendering, font sizes, and data values. Check the compiled CSS to confirm dynamic Tailwind classes are not generated. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Badge Rendering Test**: Inspect StatCard and BranchCard status badges in browser DevTools - observe that backgrounds are transparent/unstyled and text colors are default (will fail on unfixed code - badges appear as plain text)
2. **Typography Test**: Measure font sizes on Business Snapshot cards vs Revenue card - observe all use 34px (will fail on unfixed code - Business Snapshot should be 24px)
3. **Branch Color Test**: Inspect BranchCard code and observe hardcoded name check `branch.name.toLowerCase() === "yaba"` instead of `branch.color` usage (will fail on unfixed code - adding a third branch would break)
4. **Hardcoded Data Test**: Observe dashboard displays exact string "₦3,050,000" that doesn't change when branch data changes (will fail on unfixed code - revenue is not computed)
5. **Missing Badge Test**: Observe Revenue card has no status badge while BranchCards have status badges (will fail on unfixed code - inconsistent status indication)
6. **Tailwind Compilation Test**: Search compiled CSS bundle for class names like `bg-[#059669]/20` - observe they don't exist (will fail on unfixed code - confirms Tailwind doesn't generate dynamic classes)

**Expected Counterexamples**:
- Status badges render without background colors or with broken styling
- Business Snapshot values are too large (34px instead of 24px)
- Branch color logic only works for exactly two branches named Yaba and Ajah
- Revenue displays static mock value regardless of actual branch data
- Revenue card lacks status achievement indication
- Possible causes: Tailwind JIT limitation, missing hook, incorrect props, hardcoded logic

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL component WHERE isBugCondition(component) DO
  result := renderComponent_fixed(component)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Cases**:
1. **Badge Rendering Verification**: Render StatCard and BranchCard with all three badge colors (green/amber/red) and verify backgrounds are emerald-600/20, amber-700/20, red-700/20 with matching text colors
2. **Typography Verification**: Render Business Snapshot cards and verify value font size is 24px, render Revenue card and verify font size is 34px
3. **Branch Color Verification**: Render BranchCard for Yaba branch and verify component reads from `branch.color` property, not hardcoded name check
4. **Computed Data Verification**: Mock branches with specific revenue/target values, verify dashboard displays computed sum and percentage
5. **Revenue Badge Verification**: Render Revenue card with percentage ≥100%, verify "On Target" green badge appears; test with 80-99% for "At Risk", <80% for "Behind"
6. **Dynamic Branch Count Verification**: Render dashboard with 0 branches, 1 branch, 2 branches, 5 branches - verify no hardcoded assumptions break

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL component WHERE NOT isBugCondition(component) DO
  ASSERT originalDashboard(component) = fixedDashboard(component)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy components

**Test Plan**: Observe behavior on UNFIXED code first for loading states, error states, navigation, activity feed, and chart rendering, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Loading State Preservation**: Verify loading skeletons render identically before and after fix
2. **Error State Preservation**: Verify error messages and retry buttons work identically before and after fix
3. **Navigation Preservation**: Verify all links (Manage branches, Manage team, View inventory, etc.) navigate to same routes before and after fix
4. **Activity Feed Preservation**: Verify Recent Activity section renders identically before and after fix
5. **Chart Preservation**: Verify Revenue Performance chart renders identically before and after fix
6. **Approvals Section Preservation**: Verify Target Change Requests and Stock Escalations cards render identically before and after fix
7. **Secondary Metrics Preservation**: Verify Inventory Health and Daily Submissions cards (which don't have status badges) render identically before and after fix

### Unit Tests

- Test StatCard with badge prop for each color variant (green, amber, red)
- Test StatCard with size prop for small and large variants
- Test BranchCard status badge calculation at boundary conditions (exactly 80%, exactly 100%)
- Test useDashboardMetrics with 0 branches, 1 branch, 2 branches, branches with null targets
- Test useDashboardMetrics percentage calculation when target is zero (should return 0, not divide by zero)

### Property-Based Tests

- Generate random branch arrays (varying count, revenue, targets) and verify useDashboardMetrics always computes correct sums
- Generate random badge colors and verify StatCard always uses static Tailwind classes, never template literals
- Generate random percentage values (0-200%) and verify Revenue card always assigns correct status badge
- Test that all non-buggy dashboard sections produce identical output across many random data scenarios

### Integration Tests

- Test full dashboard render with real branch data from useBranches hook
- Test dashboard updates when branch data changes (e.g., revenue increases)
- Test that status badges update correctly when percentages cross thresholds (79%→80%, 99%→100%)
- Test responsive layout at different viewport widths to ensure fixes don't break grid layout
- Test keyboard navigation and link clicks to ensure fixes don't break interactivity
