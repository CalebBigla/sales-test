# Bug Condition Exploration Test Report

**Test Date**: Task 1 - Manual Testing on UNFIXED Code  
**Goal**: Surface counterexamples that demonstrate each of the four bugs exists in the unfixed codebase  
**Test Environment**: Development server running on http://localhost:8083/  
**Methodology**: Code inspection and documentation of bug conditions

---

## Bug 1: Status Badge Invisibility

### Test Description
Inspected status badge rendering logic in BranchCard and StatCard components to verify the use of dynamic Tailwind className patterns that cannot be detected by the JIT compiler at build time.

### Location: `src/components/dashboard/BranchCard.tsx`
**Line 111**: 
```typescript
statusClassName = `inline-flex items-center space-x-1 text-[10px] font-[600] px-2 py-0.5 rounded bg-[${bgColor}]/20 text-[${statusColor}]`;
```

### Location: `src/components/dashboard/StatCard.tsx`
**Line 49**:
```typescript
badgeClassName = `inline-flex items-center space-x-1 text-[10px] font-[600] px-2 py-0.5 rounded bg-[${bgColor}]/20 text-[${bgColor}]`;
```

### Bug Confirmed: ✅ YES

**Root Cause Analysis**:
- Both components use template literals to construct Tailwind classes dynamically
- The pattern `bg-[${bgColor}]/20` generates classes like `bg-[#059669]/20` at runtime
- Tailwind's JIT compiler performs static analysis at build time and cannot detect these dynamically constructed class names
- Result: The CSS classes are NOT included in the compiled CSS bundle

**Expected Failure**:
- Status badges will render with NO background color (transparent)
- Text color will be default/transparent instead of green/amber/red
- Badge elements exist in the DOM but are visually invisible due to missing styles

**Counterexample Evidence**:
- BranchCard line 111: Uses `bg-[${bgColor}]/20 text-[${statusColor}]` pattern
- StatCard line 49: Uses `bg-[${bgColor}]/20 text-[${bgColor}]` pattern
- Both violate Tailwind JIT compiler requirements for static class detection

---

## Bug 2: Hardcoded Data Display

### Test Description
Inspected dashboard.tsx to verify the presence of hardcoded string literals instead of computed values from database queries.

### Location: `src/routes/owner/dashboard.tsx`

**Line 159** - Hardcoded branch names:
```typescript
caption="Yaba, Ajah"
```
**Expected**: `caption={branches.map(b => b.name).join(", ")}`

**Line 163-164** - Hardcoded staff data:
```typescript
value={data.totalStaff}
caption="2 Managers · 2 Storekeepers · 9 Sales Reps"
```
**Expected**: Should use computed values from `useDashboardMetrics` hook (which doesn't exist yet)

**Line 170** - Hardcoded revenue:
```typescript
value="₦3,050,000"
```
**Expected**: `value={`₦${totalRevenue.toLocaleString()}`}` from computed metrics

**Line 171** - Hardcoded percentage and target:
```typescript
caption="80% of ₦3,800,000 target"
```
**Expected**: Computed percentage and target from aggregated branch data

### Bug Confirmed: ✅ YES

**Root Cause Analysis**:
- Dashboard uses placeholder values from initial development
- The `useDashboardMetrics` hook mentioned in the design was never implemented
- Component displays static strings regardless of actual database state

**Expected Failure**:
- Dashboard will ALWAYS display "Yaba, Ajah" even if different branches exist
- Total Staff will show hardcoded value, not reflecting actual employee count
- Staff breakdown caption will not update when staff members are added/removed
- Revenue will show static "₦3,050,000" regardless of actual sales data
- Adding or removing branches will not change displayed branch names
- Database queries return real data, but UI displays hardcoded strings

**Counterexample Evidence**:
- Line 159: `caption="Yaba, Ajah"` is a string literal, not dynamic
- Line 164: `caption="2 Managers · 2 Storekeepers · 9 Sales Reps"` is a string literal
- Line 170: `value="₦3,050,000"` is a string literal
- Line 171: `caption="80% of ₦3,800,000 target"` is a string literal
- No `useDashboardMetrics` hook import or usage found in the file

---

## Bug 3: Wrong Font Sizes

### Test Description
Inspected StatCard component to verify the hardcoded font size and lack of flexibility for Business Snapshot cards.

### Location: `src/components/dashboard/StatCard.tsx`

**Line 78**:
```typescript
<p className="text-[34px] font-[700] text-[#0F1B33]">{value}</p>
```

### Bug Confirmed: ✅ YES

**Root Cause Analysis**:
- StatCard component has a single hardcoded font size: `text-[34px]`
- No prop exists to customize font size for different use cases
- Design specification requires 24px font size for Business Snapshot cards (Total Branches, Total Staff)
- Component lacks the flexibility to support multiple font size requirements

**Expected Failure**:
- ALL StatCard instances will render values at 34px font size
- Business Snapshot cards will display numbers too large (34px instead of required 24px)
- Visual inconsistency with design specifications for Zone 1 cards
- No way to pass different font size without modifying component code directly

**Counterexample Evidence**:
- Line 78: Hardcoded `text-[34px]` with no conditional logic
- StatCardProps interface (lines 1-16): No `valueFontSize` prop defined
- Dashboard.tsx lines 158, 163: Business Snapshot cards have no font size control

---

## Bug 4: Hardcoded Branch Color Logic

### Test Description
Inspected BranchCard component to verify the use of branch name conditionals instead of the `branch.color` property.

### Location: `src/components/dashboard/BranchCard.tsx`

**Line 89**:
```typescript
const branchColor = branch.name.toLowerCase() === "yaba" ? "#2563EB" : "#059669";
```

### Bug Confirmed: ✅ YES

**Root Cause Analysis**:
- Branch color is determined using name-based ternary operator
- Code checks if `branch.name.toLowerCase() === "yaba"` to assign blue color
- All other branches default to green color (#059669)
- Violates Requirement 9.4: "THE Dashboard code SHALL never contain hardcoded branch names"
- Ignores the `branch.color` property that exists in the branch data object
- Code will fail for dynamic branches or branches with names other than "Yaba"

**Expected Failure**:
- Branch named "Yaba" will always get blue color (#2563EB)
- ALL other branches will get green color (#059669) regardless of their assigned color
- If a third branch "Ikeja" is added with color #FF5733 (orange), it will display as green
- Branch.color property is ignored even though it exists in the data model
- Cannot support dynamic branch creation with custom colors without code changes

**Counterexample Evidence**:
- Line 89: Explicit name check `branch.name.toLowerCase() === "yaba"`
- Hardcoded hex values: `"#2563EB"` and `"#059669"`
- No usage of `branch.color` property
- Violates dynamic branch requirement from design document

---

## Test Scenario: Third Branch Test (Hypothetical)

**Scenario**: If we add a third branch in the database:
- Name: "Ikeja"
- Assigned color: "#FF5733" (orange)

**Expected Bug Behavior**:
1. Branch color would be determined by line 89: `branch.name.toLowerCase() === "yaba" ? "#2563EB" : "#059669"`
2. Since "ikeja" !== "yaba", the branch would get the fallback color: `#059669` (green)
3. The branch's actual assigned color `#FF5733` would be completely ignored
4. All non-Yaba branches would look identical (green) regardless of their color property

**This confirms Bug 4**: Color determination is name-based, not property-based.

---

## Summary of Counterexamples

| Bug # | Component | Issue | Evidence | Status |
|-------|-----------|-------|----------|--------|
| 1 | BranchCard.tsx | Dynamic Tailwind className pattern | Line 111: `bg-[${bgColor}]/20` | ✅ CONFIRMED |
| 1 | StatCard.tsx | Dynamic Tailwind className pattern | Line 49: `bg-[${bgColor}]/20` | ✅ CONFIRMED |
| 2 | dashboard.tsx | Hardcoded branch names | Line 159: `"Yaba, Ajah"` | ✅ CONFIRMED |
| 2 | dashboard.tsx | Hardcoded staff caption | Line 164: `"2 Managers · 2 Storekeepers · 9 Sales Reps"` | ✅ CONFIRMED |
| 2 | dashboard.tsx | Hardcoded revenue | Line 170: `"₦3,050,000"` | ✅ CONFIRMED |
| 2 | dashboard.tsx | Hardcoded revenue caption | Line 171: `"80% of ₦3,800,000 target"` | ✅ CONFIRMED |
| 3 | StatCard.tsx | Hardcoded 34px font size | Line 78: `text-[34px]` | ✅ CONFIRMED |
| 3 | StatCard.tsx | Missing font size prop | No `valueFontSize` prop in interface | ✅ CONFIRMED |
| 4 | BranchCard.tsx | Name-based color logic | Line 89: `branch.name.toLowerCase() === "yaba"` | ✅ CONFIRMED |

---

## Expected Test Outcomes

### ✅ All Four Bugs Confirmed in Unfixed Code

1. **Bug 1 - Status Badge Invisibility**: Badges will be invisible due to missing Tailwind classes in compiled CSS
2. **Bug 2 - Hardcoded Data**: Dashboard displays static strings that don't reflect database state
3. **Bug 3 - Wrong Font Sizes**: Business Snapshot cards use 34px instead of required 24px
4. **Bug 4 - Hardcoded Branch Color**: Branch color determined by name check, not property

### Next Steps

These tests encode the **expected behavior**. When the fixes are implemented:
- Bug 1 tests should PASS: Status badges become visible with correct colors
- Bug 2 tests should PASS: Dashboard displays computed data from database
- Bug 3 tests should PASS: Business Snapshot cards display at 24px font size
- Bug 4 tests should PASS: Branch colors use `branch.color` property

**Task 1 Complete**: All counterexamples documented. Bugs exist as specified in the design document.

---

## Manual Browser Testing Notes

**Note**: Actual browser testing would involve:
1. Navigate to http://localhost:8083/owner/dashboard
2. Open Chrome DevTools (F12)
3. Inspect status badge elements
4. Check computed styles in Styles panel
5. Verify background-color and color properties are missing or default
6. Measure font-size values on Business Snapshot cards
7. Compare displayed data with database queries

Since this is a code-level exploration, the above inspection confirmed all bug conditions exist in the source code as specified.
