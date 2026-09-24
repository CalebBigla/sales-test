import { Link } from "@tanstack/react-router";

interface OwnerDashboardHeaderProps {
  businessName: string;
  ownerFirstName: string;
}

export function OwnerDashboardHeader({ businessName, ownerFirstName }: OwnerDashboardHeaderProps) {
  return (
    <header className="bg-[#12233D] text-white">
      <div className="max-w-[1280px] mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <span className="text-white text-[12px] font-[700]">SF</span>
            </div>
            <span className="text-[20px] font-[700] tracking-[-0.5px]">SalesFlow Pro</span>
          </div>
          <span className="text-[14px] font-[400] opacity-90">{businessName}</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-[#1e293b] transition-colors">
              {/* Bell icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 104 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Unread badge */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#B91C1C] rounded-full"></span>
            </button>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1e293b] transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center">
                <span className="text-white text-[14px] font-[600]">{ownerFirstName.charAt(0)}</span>
              </div>
              <span className="hidden md:block font-[500]">{ownerFirstName}</span>
              {/* Dropdown arrow */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            /* Dropdown menu would go here in a real implementation */
          </div>

          {/* Help Icon */}
          <button className="p-2 rounded-lg hover:bg-[#1e293b] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a0 0 0 000 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m2 0a0 0 0 000 0v2a2 2 0 012 2h2a2 2 0 002-2zm0-6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}