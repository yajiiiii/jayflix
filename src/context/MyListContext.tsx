"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { NormalizedContent } from "@/services/content";

interface MyListContextType {
  myList: NormalizedContent[];
  addToMyList: (item: NormalizedContent) => void;
  removeFromMyList: (id: string) => void;
  isInMyList: (id: string) => boolean;
  toggleMyList: (item: NormalizedContent) => void;
}

const MyListContext = createContext<MyListContextType | undefined>(undefined);

export function MyListProvider({ children }: { children: React.ReactNode }) {
  const [myList, setMyList] = useState<NormalizedContent[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("netflix-my-list");
    if (stored) {
      try {
        setMyList(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("netflix-my-list", JSON.stringify(myList));
  }, [myList]);

  const addToMyList = useCallback((item: NormalizedContent) => {
    setMyList((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromMyList = useCallback((id: string) => {
    setMyList((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isInMyList = useCallback(
    (id: string) => myList.some((i) => i.id === id),
    [myList]
  );

  const toggleMyList = useCallback(
    (item: NormalizedContent) => {
      if (isInMyList(item.id)) {
        removeFromMyList(item.id);
      } else {
        addToMyList(item);
      }
    },
    [isInMyList, removeFromMyList, addToMyList]
  );

  return (
    <MyListContext.Provider
      value={{ myList, addToMyList, removeFromMyList, isInMyList, toggleMyList }}
    >
      {children}
    </MyListContext.Provider>
  );
}

export function useMyList() {
  const context = useContext(MyListContext);
  if (!context) {
    throw new Error("useMyList must be used within a MyListProvider");
  }
  return context;
}
