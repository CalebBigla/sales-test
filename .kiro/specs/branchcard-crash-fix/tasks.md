# Implementation Plan: BranchCard Crash Fix

## Overview
Fix the BranchCard crash by ensuring useBranches() returns complete data structure and BranchCard handles all edge cases defensively.

---

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - BranchCard Crashes on Undefined Revenue Access
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope property to concrete failing case - branch object without revenue field passed to BranchCard
  - Create test file: `src/components/dashboard/__tests__/BranchCard.crash.test.tsx`
  - Test implementation:
    - Render BranchCard with incomplete branch object (missing revenue/target/submissionsToday/totalRepsToday)
    - Assert component renders without crashing (this is the expected behavior)
    - Assert skeleton or fallback UI is displayed instead of attempting to access undefined properties
  - The test assertions should match the Expected Behavior: "SHALL validate that all required fields exist before attempting to access them"
  - Run test on UNFIXED code (current BranchCard.tsx)
  - **EXPECTED OUTCOME**: Test FAILS with "Cannot read properties of undefined (reading 'revenue')" error
  - Document counterexamples found:
    - `BranchCard({ branch: { id: 'test', name: 'Test' } })` crashes at line 60
    - Branch object from useBranches() missing revenue field causes crash
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing BranchCard Behavior with Complete Data
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code with complete branch objects
  - Create test file: `src/components/dashboard/__tests__/BranchCard.preservation.test.tsx`
  - Write property-based tests capturing observed behavior patterns:
    - When skeleton prop is true, renders skeleton UI (regardless of branch prop)
    - When branch has complete data with revenue >= target, shows "On Target" status
    - When branch has complete data with revenue >= 80% target, shows "At Risk" status
    - When branch has complete data with revenue < 80% target, shows "Behind" status
    - When branch name is "Yaba", uses blue color (#2563EB)
    - When branch name is "Ajah", uses green color (#059669)
    - When onClick prop provided, clicking card fires handler
    - Renders "View Detail →" link with correct routing
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 3. Fix BranchCard crash and implement complete data flow

  - [x] 3.1 Update Branch interface in useBranches.ts with all required fields
    - Add `revenue: number` to Branch interface
    - Add `salesCount: number` to Branch interface
    - Add `target: number | null` to Branch interface
    - Add `submissionsToday: number` to Branch interface
    - Add `totalRepsToday: number` to Branch interface
    - Keep existing `id`, `name`, `color` fields
    - Export updated Branch interface for use across components
    - _Bug_Condition: Branch interface missing required fields causes undefined access_
    - _Expected_Behavior: Complete Branch interface with all required fields defined_
    - _Preservation: Existing id, name, color fields remain unchanged_
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 3.2 Refactor useBranches() hook to return complete data
    - Update mock data implementation in `src/hooks/useBranches.ts`
    - Return Yaba branch with complete data:
      - id: "yaba", name: "Yaba", color: "#2563EB"
      - revenue: 1850000, salesCount: 145, target: 2000000
      - submissionsToday: 12, totalRepsToday: 8
    - Return Ajah branch with complete data:
      - id: "ajah", name: "Ajah", color: "#059669"
      - revenue: 1200000, salesCount: 98, target: 1800000
      - submissionsToday: 7, totalRepsToday: 5
    - Maintain existing loading/error state behavior
    - _Bug_Condition: useBranches() returns incomplete branch objects without revenue/target_
    - _Expected_Behavior: useBranches() returns Branch[] with all required fields populated_
    - _Preservation: loading, error states and timing remain unchanged_
    - _Requirements: 1.2, 2.1_

  - [x] 3.3 Add defensive rendering to BranchCard component
    - File: `src/components/dashboard/BranchCard.tsx`
    - Add field validation after null check:
      ```typescript
      // Validate required fields exist
      const hasRequiredFields = 
        typeof branch.revenue === 'number' &&
        typeof branch.salesCount === 'number' &&
        typeof branch.submissionsToday === 'number' &&
        typeof branch.totalRepsToday === 'number';
      
      if (!hasRequiredFields) {
        console.error('BranchCard received incomplete branch data:', branch);
        return <SkeletonCard />;
      }
      ```
    - Add null-safe target handling (target can be null):
      ```typescript
      const percentage = branch.target && branch.target > 0
        ? Math.round((branch.revenue / branch.target) * 100)
        : 0;
      ```
    - Maintain existing skeleton rendering logic
    - Maintain existing status calculation logic
    - _Bug_Condition: BranchCard accesses branch.revenue without validating field exists_
    - _Expected_Behavior: BranchCard validates all required fields before accessing them_
    - _Preservation: Skeleton rendering, status calculation, onClick behavior unchanged_
    - _Requirements: 1.3, 1.4, 2.2, 2.3_

  - [x] 3.4 Update owner dashboard component with loading guards
    - File: `src/components/owner-dashboard-content.tsx`
    - Import useBranches hook and BranchCard component
    - Destructure `{ branches, loading, error }` from useBranches()
    - Add error state rendering:
      ```typescript
      if (error) {
        return <ErrorAlert message={error} />;
      }
      ```
    - Add loading state rendering:
      ```typescript
      if (loading) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BranchCard skeleton />
            <BranchCard skeleton />
          </div>
        );
      }
      ```
    - Add populated state rendering:
      ```typescript
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      );
      ```
    - _Bug_Condition: Parent maps branches without checking loading state or validating data_
    - _Expected_Behavior: Parent checks loading state before rendering BranchCards_
    - _Preservation: Authentication checks, routing, other dashboard sections unchanged_
    - _Requirements: 1.1, 1.2, 2.4_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - BranchCard Handles Incomplete Data Gracefully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - BranchCard renders skeleton instead of crashing
    - Console error logged with incomplete branch data details
    - _Requirements: 2.2, 2.3_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing BranchCard Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Skeleton rendering still works
    - Status calculation unchanged
    - Branch colors unchanged
    - onClick behavior unchanged
    - Routing unchanged
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Manual verification and testing
  - [~] 4.1 Start development server and navigate to /owner/dashboard
    - Verify zero console errors on page load
    - Verify no TypeError about undefined revenue
    - Document any unexpected warnings or errors
  
  - [~] 4.2 Verify Yaba branch card displays correctly
    - Revenue shows ₦1,850,000
    - Target shows ₦2,000,000
    - Status shows "On Target" or appropriate percentage
    - Submissions shows "12/8 REPS"
    - Blue color indicator displayed
    - Card is clickable
  
  - [~] 4.3 Verify Ajah branch card displays correctly
    - Revenue shows ₦1,200,000
    - Target shows ₦1,800,000
    - Status shows appropriate percentage
    - Submissions shows "7/5 REPS"
    - Green color indicator displayed
    - Card is clickable
  
  - [~] 4.4 Verify loading state works
    - Temporarily increase setTimeout delay to 2000ms in useBranches
    - Reload page and verify skeleton cards appear
    - Wait for loading to complete
    - Verify transition to populated cards
    - Reset timeout to 500ms
  
  - [~] 4.5 Test edge case: simulate error state
    - Modify useBranches to throw error in catch block
    - Verify error UI displays (if implemented)
    - Restore normal useBranches implementation
  
  - [~] 4.6 Verify "View Detail →" links work
    - Click "View Detail →" on Yaba card
    - Verify navigation to /owner/branches/yaba (or appropriate route)
    - Navigate back to dashboard
    - Click "View Detail →" on Ajah card
    - Verify navigation works

- [x] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests: `npm test` (or appropriate command)
  - Verify bug condition test passes (task 3.5)
  - Verify preservation tests pass (task 3.6)
  - Verify zero console errors in browser
  - Verify manual verification checklist complete (task 4)
  - If any failures, investigate and fix before marking complete

---

## Success Criteria
✓ `/owner/dashboard` renders with zero console errors  
✓ Both Yaba and Ajah branch cards show populated revenue figures  
✓ BranchCard never crashes on undefined access  
✓ Loading state shows skeleton cards  
✓ All automated tests pass  
✓ Manual verification checklist complete  

## Files Modified
1. `src/hooks/useBranches.ts` - Updated Branch interface and mock data
2. `src/components/dashboard/BranchCard.tsx` - Added defensive rendering
3. `src/components/owner-dashboard-content.tsx` - Added loading guards
4. `src/components/dashboard/__tests__/BranchCard.crash.test.tsx` - New test file
5. `src/components/dashboard/__tests__/BranchCard.preservation.test.tsx` - New test file
