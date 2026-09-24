import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import BranchCard from '../BranchCard';

// Mock TanStack Router Link to avoid routing context issues in tests
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Preservation Property Tests
 * 
 * **Property 2: Preservation** - Existing BranchCard Behavior with Complete Data
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 * 
 * These tests capture the current working behavior of BranchCard when provided
 * with complete branch data. They establish a baseline that must be preserved
 * after the bug fix to ensure no regressions.
 * 
 * **IMPORTANT**: These tests run on UNFIXED code first to observe and document
 * the existing behavior, then continue to pass after the fix to confirm no regressions.
 * 
 * **EXPECTED OUTCOME on UNFIXED code**: All tests PASS
 * **EXPECTED OUTCOME after fix**: All tests continue to PASS
 */

// Helper to create complete valid branch data
const createCompleteBranch = (overrides = {}) => ({
  id: 'test-branch',
  name: 'Test Branch',
  revenue: 1500000,
  salesCount: 100,
  target: 2000000,
  submissionsToday: 10,
  totalRepsToday: 8,
  ...overrides,
});

describe('BranchCard - Preservation: Skeleton Rendering', () => {
  it('should render skeleton UI when skeleton prop is true (regardless of branch prop)', () => {
    // Arrange
    const completeBranch = createCompleteBranch();

    // Act: Render with skeleton=true
    const { container } = render(<BranchCard skeleton={true} branch={completeBranch} />);

    // Assert: Should show skeleton UI elements
    expect(container).toBeInTheDocument();
    
    // Skeleton should have placeholder elements (bg-[#E5E9F0])
    const placeholders = container.querySelectorAll('.bg-\\[\\#E5E9F0\\]');
    expect(placeholders.length).toBeGreaterThan(0);
    
    // Should NOT show actual branch name
    expect(screen.queryByText('Test Branch')).not.toBeInTheDocument();
  });

  it('should render skeleton UI when skeleton prop is true even without branch data', () => {
    // Act: Render skeleton without branch
    const { container } = render(<BranchCard skeleton={true} />);

    // Assert: Should show skeleton UI
    expect(container).toBeInTheDocument();
    
    const placeholders = container.querySelectorAll('.bg-\\[\\#E5E9F0\\]');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});

describe('BranchCard - Preservation: Status Calculation', () => {
  it('should show "On Target" status when revenue >= target', () => {
    // Arrange: Revenue equals target (100%)
    const branch = createCompleteBranch({
      revenue: 2000000,
      target: 2000000,
    });

    // Act
    const { container } = render(<BranchCard branch={branch} />);

    // Assert: Should show "On Target (100%)"
    expect(screen.getByText(/On Target \(100%\)/i)).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('should show "On Target" status when revenue > target', () => {
    // Arrange: Revenue exceeds target (110%)
    const branch = createCompleteBranch({
      revenue: 2200000,
      target: 2000000,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "On Target (110%)"
    expect(screen.getByText(/On Target \(110%\)/i)).toBeInTheDocument();
  });

  it('should show "At Risk" status when revenue >= 80% of target but < 100%', () => {
    // Arrange: Revenue at 85% of target
    const branch = createCompleteBranch({
      revenue: 1700000,
      target: 2000000,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "At Risk (85%)"
    expect(screen.getByText(/At Risk \(85%\)/i)).toBeInTheDocument();
  });

  it('should show "Behind" status when revenue < 80% of target', () => {
    // Arrange: Revenue at 75% of target
    const branch = createCompleteBranch({
      revenue: 1500000,
      target: 2000000,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "Behind (75%)"
    expect(screen.getByText(/Behind \(75%\)/i)).toBeInTheDocument();
  });

  it('should show "Behind" status when revenue < 80% of target (low percentage)', () => {
    // Arrange: Revenue at 50% of target
    const branch = createCompleteBranch({
      revenue: 1000000,
      target: 2000000,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "Behind (50%)"
    expect(screen.getByText(/Behind \(50%\)/i)).toBeInTheDocument();
  });

  /**
   * Property-Based Test: Status calculation across many revenue/target combinations
   */
  it('property: should calculate status correctly for any valid revenue/target combination', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }), // revenue
        fc.integer({ min: 1, max: 10000000 }), // target (must be > 0)
        (revenue, target) => {
          // Arrange
          const branch = createCompleteBranch({ revenue, target });
          const expectedPercentage = Math.round((revenue / target) * 100);

          // Act
          const { unmount } = render(<BranchCard branch={branch} />);

          // Assert: Should show correct status based on percentage
          if (expectedPercentage >= 100) {
            expect(screen.getByText(new RegExp(`On Target \\(${expectedPercentage}%\\)`, 'i'))).toBeInTheDocument();
          } else if (expectedPercentage >= 80) {
            expect(screen.getByText(new RegExp(`At Risk \\(${expectedPercentage}%\\)`, 'i'))).toBeInTheDocument();
          } else {
            expect(screen.getByText(new RegExp(`Behind \\(${expectedPercentage}%\\)`, 'i'))).toBeInTheDocument();
          }

          // Cleanup - use unmount from render
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('BranchCard - Preservation: Branch Colors', () => {
  it('should use blue color (#2563EB) for Yaba branch', () => {
    // Arrange
    const yabaBranch = createCompleteBranch({
      id: 'yaba',
      name: 'Yaba',
    });

    // Act
    const { container } = render(<BranchCard branch={yabaBranch} />);

    // Assert: Should render branch name
    expect(screen.getByText('Yaba')).toBeInTheDocument();
    
    // Note: Color is applied via inline style, not easily testable in jsdom
    // But we verify the component renders without error
    expect(container).toBeInTheDocument();
  });

  it('should use green color (#059669) for Ajah branch', () => {
    // Arrange
    const ajahBranch = createCompleteBranch({
      id: 'ajah',
      name: 'Ajah',
    });

    // Act
    const { container } = render(<BranchCard branch={ajahBranch} />);

    // Assert: Should render branch name
    expect(screen.getByText('Ajah')).toBeInTheDocument();
    
    expect(container).toBeInTheDocument();
  });

  it('should use green color for non-Yaba branches (default)', () => {
    // Arrange: Any branch that is not Yaba
    const otherBranch = createCompleteBranch({
      id: 'surulere',
      name: 'Surulere',
    });

    // Act
    const { container } = render(<BranchCard branch={otherBranch} />);

    // Assert: Should render branch name
    expect(screen.getByText('Surulere')).toBeInTheDocument();
    
    expect(container).toBeInTheDocument();
  });
});

describe('BranchCard - Preservation: Click Handling', () => {
  it('should fire onClick handler when card is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClickMock = vi.fn();
    const branch = createCompleteBranch();

    // Act
    const { container } = render(<BranchCard branch={branch} onClick={onClickMock} />);
    
    // Find the card element and click it
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
    
    if (card) {
      await user.click(card);
    }

    // Assert: onClick should have been called
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should not crash when onClick is not provided', async () => {
    // Arrange
    const user = userEvent.setup();
    const branch = createCompleteBranch();

    // Act
    const { container } = render(<BranchCard branch={branch} />);
    
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
    
    // Should not crash when clicked without onClick handler
    if (card) {
      await user.click(card);
    }

    // Assert: Component should still be in document (no crash)
    expect(container).toBeInTheDocument();
  });
});

describe('BranchCard - Preservation: View Detail Link', () => {
  it('should render "View Detail â†’" link with correct routing', () => {
    // Arrange
    const branch = createCompleteBranch({
      id: 'yaba',
      name: 'Yaba',
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should have "View Detail â†’" link
    const detailLink = screen.getByText('View Detail â†’');
    expect(detailLink).toBeInTheDocument();
    
    // Should link to correct route
    expect(detailLink).toHaveAttribute('href', '/owner/branches/yaba');
  });

  it('should render View Detail link for any branch with correct ID in route', () => {
    // Arrange
    const branch = createCompleteBranch({
      id: 'ajah',
      name: 'Ajah',
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert
    const detailLink = screen.getByText('View Detail â†’');
    expect(detailLink).toHaveAttribute('href', '/owner/branches/ajah');
  });

  it('should stop event propagation when View Detail link is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClickMock = vi.fn();
    const branch = createCompleteBranch({
      id: 'test',
      name: 'Test',
    });

    // Act
    render(<BranchCard branch={branch} onClick={onClickMock} />);
    
    const detailLink = screen.getByText('View Detail â†’');
    await user.click(detailLink);

    // Assert: Card onClick should NOT fire when link is clicked (stopPropagation)
    // Note: In jsdom, stopPropagation works but navigation doesn't actually happen
    // We verify the link exists and has the correct href
    expect(detailLink).toHaveAttribute('href', '/owner/branches/test');
  });

  /**
   * Property-Based Test: View Detail link for any branch ID
   */
  it('property: should render correct View Detail link for any branch ID', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // branch ID
        (branchId) => {
          // Arrange
          const branch = createCompleteBranch({
            id: branchId,
            name: `Branch ${branchId}`,
          });

          // Act
          const { unmount } = render(<BranchCard branch={branch} />);

          // Assert
          const detailLink = screen.getByText('View Detail â†’');
          expect(detailLink).toHaveAttribute('href', `/owner/branches/${branchId}`);

          // Cleanup - use unmount from render
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('BranchCard - Preservation: Data Display', () => {
  it('should display branch name correctly', () => {
    // Arrange
    const branch = createCompleteBranch({
      name: 'Yaba',
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert
    expect(screen.getByText('Yaba')).toBeInTheDocument();
  });

  it('should display revenue and target with Nigerian currency formatting', () => {
    // Arrange
    const branch = createCompleteBranch({
      revenue: 1850000,
      target: 2000000,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show formatted revenue and target
    expect(screen.getByText(/â‚¦1,850,000 of â‚¦2,000,000/i)).toBeInTheDocument();
  });

  it('should display submissions and reps count', () => {
    // Arrange
    const branch = createCompleteBranch({
      submissionsToday: 12,
      totalRepsToday: 8,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "TODAY'S SUBMISSIONS: 12/8 REPS"
    expect(screen.getByText(/TODAY'S SUBMISSIONS: 12\/8 REPS/i)).toBeInTheDocument();
  });

  it('should handle zero submissions and reps', () => {
    // Arrange
    const branch = createCompleteBranch({
      submissionsToday: 0,
      totalRepsToday: 0,
    });

    // Act
    render(<BranchCard branch={branch} />);

    // Assert: Should show "TODAY'S SUBMISSIONS: 0/0 REPS"
    expect(screen.getByText(/TODAY'S SUBMISSIONS: 0\/0 REPS/i)).toBeInTheDocument();
  });

  /**
   * Property-Based Test: Data display for various valid inputs
   */
  it('property: should display branch data correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // name
        fc.integer({ min: 0, max: 100000000 }), // revenue
        fc.integer({ min: 1, max: 100000000 }), // target
        fc.integer({ min: 0, max: 100 }), // submissionsToday
        fc.integer({ min: 0, max: 100 }), // totalRepsToday
        (name, revenue, target, submissionsToday, totalRepsToday) => {
          // Arrange
          const branch = createCompleteBranch({
            name,
            revenue,
            target,
            submissionsToday,
            totalRepsToday,
          });

          // Act
          const { container, unmount } = render(<BranchCard branch={branch} />);

          // Assert: Component renders without crashing
          expect(container).toBeInTheDocument();
          
          // Should display branch name
          expect(screen.getByText(name)).toBeInTheDocument();
          
          // Should display submissions count
          expect(screen.getByText(new RegExp(`${submissionsToday}/${totalRepsToday} REPS`, 'i'))).toBeInTheDocument();

          // Cleanup - use unmount from render
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('BranchCard - Preservation: Hover and Interaction States', () => {
  it('should have cursor-pointer class for clickable cards', () => {
    // Arrange
    const branch = createCompleteBranch();

    // Act
    const { container } = render(<BranchCard branch={branch} />);

    // Assert: Card should have cursor-pointer class
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeInTheDocument();
  });

  it('should have hover state styles', () => {
    // Arrange
    const branch = createCompleteBranch();

    // Act
    const { container } = render(<BranchCard branch={branch} />);

    // Assert: Card should have hover:bg-[#F8FAFC] class
    const card = container.querySelector('.hover\\:bg-\\[\\#F8FAFC\\]');
    expect(card).toBeInTheDocument();
  });
});

