import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function KpiCard({
  title,
  children,
  className = "",
  variant = 'primary'
}: KpiCardProps) {
  // Define variants for different card types
  const variantStyles = {
    primary: 'bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6',
    secondary: 'bg-white rounded-xl border border-[#CBD5E1] shadow p-4',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      <h2 className="mb-5 text-[18px] font-[600] text-[#12233D] flex items-center space-x-2">
        {/* Title with optional icon space */}
        <span className="h-4 w-4 rounded bg-[#2563EB]/10 flex items-center justify-center text-[10px] text-[#2563EB]">
          {"•"}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}