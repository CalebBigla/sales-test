import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router';

// Mock router for testing components that use Link
const mockHistory = createMemoryHistory({
  initialEntries: ['/'],
});

// Create a minimal route tree for testing
const mockRouteTree = {
  id: '__root__',
  path: '/',
  component: () => null,
};

const mockRouter = createRouter({
  routeTree: mockRouteTree as any,
  history: mockHistory,
});

interface TestProviderProps {
  children: React.ReactNode;
}

function TestProvider({ children }: TestProviderProps) {
  return (
    <RouterProvider router={mockRouter}>
      {children}
    </RouterProvider>
  );
}

function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProvider, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
