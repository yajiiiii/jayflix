"use client";

export default function SkeletonRow() {
  return (
    <div className="mb-8 md:mb-12">
      <div className="h-6 w-48 bg-netflix-gray rounded animate-pulse mb-4 mx-4 md:mx-12" />
      <div className="flex gap-2 md:gap-3 px-4 md:px-12 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[180px] md:w-[240px] aspect-[2/3] bg-netflix-gray rounded-md animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
