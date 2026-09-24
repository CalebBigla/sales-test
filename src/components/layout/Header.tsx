import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="bg-card border-b border-border shadow-soft">
      <div className="max-w-[1280px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of sales and operations across all physical branches.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 4-segment pill toggle */}
          <div className="relative inline-flex h-9 rounded-md border border-border shadow-sm">
            {/* We'll create four buttons; the active one has white background */}
            <button
              className="inline-flex items-center px-3 py-0.5 text-[11px] font-[600] text-muted-foreground hover:text-foreground"
            >
              Day
            </button>
            <button
              className="inline-flex items-center px-3 py-0.5 text-[11px] font-[600] text-foreground bg-white border border-border hover:bg-muted/30"
            >
              Month
            </button>
            <button
              className="inline-flex items-center px-3 py-0.5 text-[11px] font-[600] text-muted-foreground hover:text-foreground"
            >
              Quarter
            </button>
            <button
              className="inline-flex items-center px-3 py-0.5 text-[11px] font-[600] text-muted-foreground hover:text-foreground"
            >
              Year
            </button>
          </div>
          {/* Notification bell */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-muted/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 104 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Red dot badge */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#B91C1C] rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

