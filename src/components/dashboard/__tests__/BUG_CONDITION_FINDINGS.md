# Bug Condition Exploration Test - Findings

## Test Execution Date
2026-09-22 11:00:33

## Test Status
✅ **TESTS FAILED AS EXPECTED** - Bug condition confirmed

## Bug Location
**File:** `src/components/dashboard/BranchCard.tsx`  
**Line:** 107 (and line 60 for percentage calculation)  
**Error:** `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`

## Counterexamples Found

The property-based tests generated multiple failing cases that demonstrate the bug:

### Example 1: Minimal incomplete branch
```typescript
{
  id: " ",
  name: " "
}
```
**Result:** Crashes at line 107 when attempting `branch.revenue.toLocaleString()`

### Example 2: Branch missing revenue field
```typescript
{
  id: "yaba",
  name: "Yaba",
  target: 2000000,
  submissionsToday: 10,
  totalRepsToday: 8
}
```
**Result:** Crashes at line 107 when attempting to access `branch.revenue`

### Example 3: Branch missing target field
```typescript
{
  id: "ajah",
  name: "Ajah",
  revenue: 1500000,
  submissionsToday: 7,
  totalRepsToday: 5
}
```
**Result:** Crashes at line 107 when attempting `branch.target.toLocaleString()`

### Example 4: Only structural fields present
```typescript
{
  id: "test-branch",
  name: "Test Branch"
}
```
**Result:** Crashes at line 60 when calculating `branch.revenue / branch.target`

## Root Cause Analysis

1. **Missing field validation:** BranchCard checks `if (!branch)` but this only catches `null` or `undefined` branch objects, not incomplete objects with missing required fields.

2. **Unsafe property access:** The component directly accesses `branch.revenue`, `branch.target`, etc. without verifying these fields exist.

3. **Multiple crash points:**
   - Line 60: `Math.round((branch.revenue / branch.target) * 100)` - crashes if revenue or target is undefined
   - Line 107: `branch.revenue.toLocaleString()` - crashes if revenue is undefined
   - Line 107: `branch.target.toLocaleString()` - crashes if target is undefined

## Expected Behavior (Encoded in Tests)

The tests encode the expected behavior after the fix:

1. **When branch data is incomplete** → Component SHALL validate required fields exist
2. **When required fields are missing** → Component SHALL render skeleton/fallback UI instead of crashing
3. **Component SHALL NOT crash** → Always render something valid (skeleton, fallback, or full UI)

## Test Coverage

The exploration tests cover:
- ✅ Branch with no fields except id/name
- ✅ Branch missing revenue field
- ✅ Branch missing target field
- ✅ Property-based testing with 20 randomized incomplete branch objects

## Next Steps

1. ✅ Bug condition confirmed and documented
2. ⏳ Implement fix (Task 3)
3. ⏳ Re-run same tests to verify fix (should pass)
4. ⏳ Write preservation tests (Task 2)

## Notes

- All 4 test cases failed as expected
- Property-based test found counterexample after 1 iteration and shrunk it 4 times to minimal failing case
- The bug affects any scenario where `useBranches()` returns incomplete data
- Current guard `if (!branch)` is insufficient - needs field-level validation
