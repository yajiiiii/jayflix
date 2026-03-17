"use client";

import { useMyList } from "@/context/MyListContext";
import ContentCard from "@/components/ContentCard";

export default function MyListPage() {
  const { myList } = useMyList();

  return (
    <div className="min-h-screen px-4 pb-12 pt-24 md:px-12">
      <h1 className="mb-8 text-2xl font-bold text-white md:text-4xl">My List</h1>

      {myList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="mb-2 text-lg text-netflix-light-gray">Your list is empty</p>
          <p className="text-sm text-netflix-light-gray/60">
            Add movies and TV shows to your list to watch them later
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {myList.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
