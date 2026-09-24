import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

interface StatCardProps {
  valueFontSize?: "small" | "large";
  label: string;
  value: string | ReactNode;
  caption?: string;
  linkText?: string;
  linkTo?: string;
  badge?: { text: string; color: "green" | "amber" | "red" };
  dot?: string;
  children?: ReactNode;
  skeleton?: boolean;
  className?: string;
  action?: ReactNode;
  onClick?: () => void;
}

export default function StatCard({
  valueFontSize = "large",
  label,
  value,
  caption,
  linkText,
  linkTo,
  badge,
  dot,
  children,
  skeleton,
  className = "",
  action,
  onClick,
}: StatCardProps) {
  if (skeleton) {
    return (
      <div className={`bg-card rounded-lg border border-border shadow-sm ${className}`}>
        <div className="p-5">
          <div className="h-3 w-20 bg-muted rounded mb-3" />
          <div className="h-4 w-32 bg-muted rounded mb-2" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const badgeColors = {
    green: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning-foreground",
    red: "bg-danger/10 text-danger",
  };

  const cardClasses = `relative bg-card rounded-lg border border-border shadow-sm ${
    onClick ? "cursor-pointer hover:shadow-md transition-all duration-200" : ""
  } ${className}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="p-5">
        {badge && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColors[badge.color]}`}>
              {badge.text}
            </span>
          </div>
        )}
        {dot && (
          <div className="absolute top-3 right-3">
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
          </div>
        )}
        <div className="mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
        </div>
        {children ? (
          <div className="space-y-2">{children}</div>
        ) : (
          <>
            <p className={`${valueFontSize === "small" ? "text-2xl" : "text-3xl"} font-bold text-foreground leading-none mb-1.5`}>
              {value}
            </p>
            {caption && (
              <p className="text-[13px] text-muted-foreground leading-snug">{caption}</p>
            )}
          </>
        )}
        {action && <div className="mt-3">{action}</div>}
        {!action && linkText && linkTo && (
          <div className="mt-3">
            <Link to={linkTo} className="text-[13px] font-semibold text-primary hover:underline">
              {linkText} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
