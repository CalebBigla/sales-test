import { ReactNode } from "react";

interface SkeletonLoaderProps {
  height: number | string;
  width: number | string;
  className?: string;
}

export function SkeletonLoader({
  height,
  width,
  className = ""
}: SkeletonLoaderProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-[#CBD5E1] shadow animate-pulse h-[${typeof height === 'number' ? `${height}px` : height}] w-[${typeof width === 'number' ? `${width}px` : width}] ${className}`}
    >
      {/* Skeleton content will be styled via CSS */}
      <div className="h-full w-full bg-[url('data:image/svg+xml;utf8,<svg xmlns="" width=""200"" height=""200""><rect width=""200"" height=""200"" fill=""%23f0f0f0""/><rect x=""0"" y=""0"" width=""50"" height=""200"" fill=""%23e0e0e0""/></svg>') bg-[length:200px_200px] bg-[animation:progress_2s_linear_infinite]"]></div>
    </div>
  );
}