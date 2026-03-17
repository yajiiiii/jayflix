"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiSearch, FiX } from "react-icons/fi";
import SearchDropdown from "./SearchDropdown";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "TV Shows", href: "/tv-shows" },
  { label: "Movies", href: "/movies" },
  { label: "New & Popular", href: "/new-popular" },
  { label: "My List", href: "/my-list" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let frame = 0;

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextValue = window.scrollY > 24;
        setScrolled((current) => (current === nextValue ? current : nextValue));
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    NAV_LINKS.forEach((link) => router.prefetch(link.href));
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = searchQuery.trim();
    if (!nextQuery) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
    setSearchOpen(false);
  };

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(10,10,10,0.92)] shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black via-black/70 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 md:px-12">
        <div className="flex items-center gap-4 md:gap-10">
          <Link
            href="/"
            className="flex items-center transition hover:opacity-90"
            aria-label="Netflix Home"
          >
            <Image
              src="/brand-logo.svg"
              alt="Netflix"
              width={170}
              height={44}
              priority
              className="h-8 w-auto md:h-9"
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition ${
                    active
                      ? "font-semibold text-white"
                      : "text-netflix-light-gray hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:block">
            <AnimatePresence initial={false}>
              {searchOpen ? (
                <motion.form
                  key="search-form"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleSearchSubmit}
                  className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center overflow-hidden rounded-full border border-white/15 bg-black/70 px-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                  <FiSearch className="shrink-0 text-white" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        if (!searchQuery.trim()) {
                          setSearchOpen(false);
                        }
                      }, 140);
                    }}
                    placeholder="Titles, people, genres"
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-netflix-light-gray"
                  />
                </motion.form>
              ) : null}
            </AnimatePresence>

            {!searchOpen ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-white transition hover:bg-white/10"
                aria-label="Open search"
              >
                <FiSearch size={20} />
              </button>
            ) : null}

            {searchOpen && searchQuery.trim().length >= 2 ? (
              <SearchDropdown
                query={searchQuery}
                onSelect={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-full p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-white/10 bg-[rgba(15,15,15,0.98)] px-4 pb-4 pt-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
          >
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-3">
                <FiSearch className="text-netflix-light-gray" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-netflix-light-gray"
                />
              </div>
            </form>

            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-white/10 font-semibold text-white"
                        : "text-netflix-light-gray hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
