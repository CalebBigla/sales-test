# Bugfix Requirements Document

## Introduction

The Owner Dashboard crashes with a TypeError when attempting to render BranchCard components. The error "Cannot read properties of undefined (reading 'revenue')" occurs at line 60 of BranchCard.tsx because the parent component performs a case-sensitive lookup that can return undefined, and then attempts to access properties on that undefined value. This prevents authenticated Owner users from viewing their dashboard.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the dashboard maps over branches and performs a lookup using `branch.name.toLowerCase()` that doesn't find a match THEN the system attempts to access `.revenue` on undefined and crashes with TypeError

1.2 WHEN `useBranches()` returns branch objects that only contain `{id, name, color}` without revenue/target fields THEN the parent component creates a separate lookup object to provide these missing fields

1.3 WHEN the lookup object returns undefined because of name mismatch or missing entry THEN BranchCard receives a branch prop where `branch.revenue` is undefined and crashes when calculating percentage

1.4 WHEN BranchCard's guards check `if (!branch)` but branch is an object missing required fields THEN the guard fails to catch the incomplete data and allows execution to continue to the crashing line

### Expected Behavior (Correct)

2.1 WHEN the dashboard needs revenue/target data for branches THEN the system SHALL include these fields directly in the useBranches hook's returned data structure

2.2 WHEN BranchCard receives a branch prop THEN the system SHALL validate that all required fields (revenue, target, submissionsToday, totalRepsToday) exist before attempting to access them

2.3 WHEN BranchCard detects missing required fields on the branch object THEN the system SHALL render the skeleton loading state instead of crashing

2.4 WHEN the parent component is still loading branch data THEN the system SHALL render skeleton BranchCard components and SHALL NOT attempt to map over branches array until loading is complete

### Unchanged Behavior (Regression Prevention)

3.1 WHEN branch data has finished loading and all required fields are present THEN the system SHALL CONTINUE TO render BranchCard components with populated revenue figures for both Yaba and Ajah branches

3.2 WHEN a user clicks on a BranchCard THEN the system SHALL CONTINUE TO respond to the onClick handler

3.3 WHEN the skeleton prop is explicitly set to true THEN BranchCard SHALL CONTINUE TO render the skeleton loading state regardless of branch prop value

3.4 WHEN authenticated Owner users navigate to /owner/dashboard THEN the system SHALL CONTINUE TO check authentication before rendering and redirect to login if not authenticated

3.5 WHEN the loading state transitions from true to false THEN the system SHALL CONTINUE TO hide skeleton components and show actual data

3.6 WHEN useBranches or useDashboardData hooks return an error THEN the system SHALL CONTINUE TO display the error UI with retry button
