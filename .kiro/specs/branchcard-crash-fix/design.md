# Technical Design Document: BranchCard Crash Fix

## Overview

This design addresses the BranchCard crash by implementing proper data loading states, defensive rendering, and complete data structure from the database layer through to UI components.

## Architecture

### Naming Convention (FINAL)
- **Database layer:** `location` table/column (unchanged)
- **UI layer:** "Branch" terminology everywhere (BranchCard, useBranches, /owner/branches)
- **Translation seam:** useBranches() hook maps location data to branch UI shape

## Component Hierarchy & Data Flow

```
┌─────────────────────────────────────┐
│  Owner Dashboard Page               │
│  - Consumes useBranches()           │
│  - Checks loading state             │
│  - Maps branches → BranchCard       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  useBranches() Hook                 │
│  - Queries get_revenue_by_location()│
│  - Queries get_rep_performance...() │
│  - Computes aggregated target       │
│  - Returns { branches, loading,     │
│    error }                           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  BranchCard Component               │
│  State Machine:                     │
│  1. Loading → skeleton UI           │
│  2. Empty → "No data yet" states    │
│  3. Populated → full data display   │
└─────────────────────────────────────┘
```

## Data Structure

### Branch Interface (UI layer)
```typescript
interface Branch {
  id: string;              // location value (unique identifier)
  name: string;            // display name (e.g., "Yaba", "Ajah")
  location: string;        // actual DB location value
  revenue: number;         // aggregated sales for current period
  salesCount: number;      // number of sales transactions
  target: number | null;   // SUM of all reps' targets for this location
  color: string;           // UI chart color (e.g., "#2563EB")
  submissionsToday: number;    // count of today's sales
  totalRepsToday: number;      // count of active reps assigned to location
}
```

### Hook Return Type
```typescript
interface UseBranchesReturn {
  branches: Branch[];      // 0, 1, 2, or N branches (dynamic)
  loading: boolean;        // true until data fetched
  error: string | null;    // error message if fetch fails
}
```

## Implementation Plan

### 1. useBranches() Hook Refactor

**File:** `src/hooks/useBranches.ts`

**Current Issues:**
- Returns only `{ id, name, color }` (incomplete)
- Hardcoded Yaba/Ajah mock data
- No database integration

**New Implementation:**

```typescript
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true);
        
        // Step 1: Get revenue by location
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_revenue_by_location', {
            _period_start: startOfMonth(new Date()),
            _period_end: new Date()
          });

        if (revenueError) throw revenueError;

        // Step 2: For each location, get rep performance to calculate target
        const branchesWithData = await Promise.all(
          revenueData.map(async (loc) => {
            const { data: repData } = await supabase
              .rpc('get_rep_performance_by_location', {
                _location: loc.location
              });

            // Calculate aggregated target from all reps at this location
            const aggregatedTarget = repData?.reduce(
              (sum, rep) => sum + (rep.target_amount || 0), 
              0
            ) || null;

            // Count today's submissions
            const { count: todayCount } = await supabase
              .from('sales_entries')
              .select('*', { count: 'exact', head: true })
              .eq('location', loc.location)
              .gte('sold_at', startOfDay(new Date()).toISOString());

            // Count active reps
            const { count: repCount } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('location', loc.location)
              .in('role', ['sales_rep']);

            // Assign color (deterministic based on location name)
            const color = getLocationColor(loc.location);

            return {
              id: loc.location,
              name: loc.location,
              location: loc.location,
              revenue: loc.revenue || 0,
              salesCount: loc.sales_count || 0,
              target: aggregatedTarget,
              color,
              submissionsToday: todayCount || 0,
              totalRepsToday: repCount || 0
            };
          })
        );

        setBranches(branchesWithData);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load branches');
        setBranches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, []);

  return { branches, loading, error };
}

// Deterministic color assignment
function getLocationColor(location: string): string {
  const colors = [
    '#2563EB', '#059669', '#DC2626', '#7C3AED', 
    '#EA580C', '#0891B2', '#BE185D'
  ];
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
```

**Seed Data for Local Dev:**
For environments without real database, mock implementation returns:
```typescript
const mockBranches: Branch[] = [
  {
    id: "Yaba",
    name: "Yaba",
    location: "Yaba",
    revenue: 1850000,
    salesCount: 145,
    target: 2000000,
    color: "#2563EB",
    submissionsToday: 12,
    totalRepsToday: 8
  },
  {
    id: "Ajah",
    name: "Ajah",
    location: "Ajah",
    revenue: 1200000,
    salesCount: 98,
    target: 1800000,
    color: "#059669",
    submissionsToday: 7,
    totalRepsToday: 5
  }
];
```

### 2. BranchCard Component Refactor

**File:** `src/components/BranchCard.tsx`

**Current Issues:**
- Line 60: Accesses `branch.revenue` without null check
- Guard `if (!branch)` doesn't validate required fields
- No empty state handling

**State Machine:**

```
┌─────────────┐
│   Loading   │ ← skeleton prop = true OR branch undefined
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Empty    │ ← branch exists but revenue = 0 AND target = null
│  Data State │   Shows "No sales yet", "No target set"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Populated  │ ← branch exists with revenue > 0 OR target exists
│    State    │   Shows full card with data
└─────────────┘
```

**New Implementation:**

```typescript
interface BranchCardProps {
  branch?: Branch;
  skeleton?: boolean;
  onClick?: () => void;
}

export function BranchCard({ branch, skeleton = false, onClick }: BranchCardProps) {
  // State 1: Loading
  if (skeleton || !branch) {
    return (
      <Card className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-4 w-16" />
      </Card>
    );
  }

  // Validate required fields exist
  const hasRequiredFields = 
    typeof branch.revenue === 'number' &&
    typeof branch.salesCount === 'number' &&
    typeof branch.submissionsToday === 'number' &&
    typeof branch.totalRepsToday === 'number';

  if (!hasRequiredFields) {
    console.error('BranchCard received incomplete branch data:', branch);
    return (
      <Card className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-4 w-16" />
      </Card>
    );
  }

  // State 2: Empty (new branch with no data)
  const isEmpty = branch.revenue === 0 && branch.target === null;
  
  if (isEmpty) {
    return (
      <Card 
        className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {branch.name}
            </div>
            <div className="text-2xl font-bold mt-1">₦0</div>
          </div>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: branch.color }}
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            No sales recorded yet
          </div>
          <div className="text-sm text-muted-foreground">
            No target set yet
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {branch.totalRepsToday} {branch.totalRepsToday === 1 ? 'rep' : 'reps'} assigned
          </div>
        </div>
      </Card>
    );
  }

  // State 3: Populated (normal operation)
  const achievement = branch.target && branch.target > 0
    ? Math.round((branch.revenue / branch.target) * 100)
    : 0;

  return (
    <Card 
      className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            {branch.name}
          </div>
          <div className="text-2xl font-bold mt-1">
            ₦{(branch.revenue / 1000000).toFixed(2)}M
          </div>
        </div>
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: branch.color }}
        />
      </div>
      
      {branch.target && branch.target > 0 ? (
        <>
          <Progress value={achievement} className="mb-2" />
          <div className="text-sm text-muted-foreground">
            {achievement}% of ₦{(branch.target / 1000000).toFixed(2)}M target
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground mb-2">
          No target set yet
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-3">
        {branch.submissionsToday} submissions today • {branch.totalRepsToday} reps active
      </div>
    </Card>
  );
}
```

### 3. Parent Component (Owner Dashboard) Refactor

**File:** `src/components/owner-dashboard-content.tsx` (or similar)

**Current Issues:**
- Maps branches immediately without checking loading state
- Performs case-sensitive lookup that can return undefined
- Passes incomplete branch objects to BranchCard

**New Implementation:**

```typescript
export function OwnerDashboardContent() {
  const { branches, loading, error } = useBranches();

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading branches</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Branch Performance</h2>
        
        {/* Loading state: show skeleton cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BranchCard skeleton />
            <BranchCard skeleton />
          </div>
        ) : branches.length === 0 ? (
          /* Empty state: no branches exist yet */
          <Card className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              No branches set up yet
            </div>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create First Branch
            </Button>
          </Card>
        ) : (
          /* Populated state: render branch cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onClick={() => {
                  // Navigate to branch detail or open modal
                  console.log('Clicked branch:', branch.name);
                }}
              />
            ))}
          </div>
        )}
      </section>
      
      {/* Other dashboard sections... */}
    </div>
  );
}
```

## Edge Cases Handled

1. **Zero branches:** Shows "No branches set up yet" empty state
2. **New branch (no sales, no target):** Shows empty state with "No sales recorded yet"
3. **Branch with sales but no target:** Shows revenue but "No target set yet"
4. **Branch with target but no sales:** Shows 0% achievement
5. **Loading state:** Shows skeleton cards during fetch
6. **Error state:** Shows error alert with message
7. **Missing required fields:** Falls back to skeleton (prevents crash)

## Testing Scenarios

### Unit Tests (BranchCard)
1. ✓ Renders skeleton when `skeleton={true}`
2. ✓ Renders skeleton when `branch={undefined}`
3. ✓ Renders empty state when revenue=0 and target=null
4. ✓ Renders "No target set yet" when revenue>0 but target=null
5. ✓ Renders populated state with valid data
6. ✓ Calculates achievement percentage correctly
7. ✓ Falls back to skeleton when required fields missing

### Integration Tests (Dashboard + Hook)
1. ✓ Shows skeleton cards while loading=true
2. ✓ Shows branch cards when loading=false and branches.length > 0
3. ✓ Shows error alert when error is not null
4. ✓ Shows empty state when loading=false and branches.length === 0
5. ✓ Handles 1, 2, or N branches dynamically

### Manual Testing Checklist
- [ ] Dashboard loads without console errors
- [ ] Both Yaba and Ajah cards render with correct figures
- [ ] Skeleton cards show during initial load
- [ ] Empty branch card shows appropriate copy
- [ ] Branch with no target shows "No target set yet"
- [ ] Achievement percentage calculates correctly
- [ ] Click handler fires on card click

## Migration Path

### Phase 1: This Bugfix (immediate)
- ✓ Fix useBranches() to return complete data
- ✓ Fix BranchCard 3-state rendering
- ✓ Fix parent component loading guard
- ✓ Seed Yaba/Ajah for local dev

### Phase 2: Future Work (separate tasks)
1. **Create Branch Form:** UI + API endpoint for adding new branches
2. **Branch Management Table:** Proper `branches` table with FK relationships
3. **Branch Deletion/Archival:** Soft delete with historical data preservation
4. **Branch Settings:** Edit name, assign manager, set default color
5. **Branch Analytics:** Deep-dive page per branch with detailed metrics

## Files Modified

1. `src/hooks/useBranches.ts` - Complete refactor
2. `src/components/BranchCard.tsx` - Add 3-state rendering
3. `src/components/owner-dashboard-content.tsx` - Add loading guards
4. `src/lib/supabase.ts` - (if needed) Add RPC helper functions

## Success Criteria

- [ ] `/owner/dashboard` renders with zero console errors
- [ ] Both branch cards show populated revenue figures (not skeleton)
- [ ] BranchCard never crashes on undefined access
- [ ] Dashboard supports 0, 1, 2, or N branches dynamically
- [ ] Empty state UI shows appropriate copy (not broken zeros)
- [ ] Loading state shows skeleton cards
- [ ] Error state shows error alert with retry option

## Rollback Plan

If issues arise:
1. Revert `useBranches.ts` to original (will re-break but in known way)
2. Add null check to BranchCard.tsx line 60 as temporary band-aid
3. Log detailed error context for further investigation
4. Deploy hotfix within 1 hour of detection
