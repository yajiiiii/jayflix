"use client";

import { FiFacebook, FiGithub, FiInstagram, FiTwitter } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/6 bg-[#111111] px-4 py-12 text-netflix-light-gray md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex gap-4">
          <a href="https://www.facebook.com/yajiwhat" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="Facebook">
            <FiFacebook size={22} />
          </a>
          <a href="https://www.instagram.com/justblame_jay/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="Instagram">
            <FiInstagram size={22} />
          </a>
          <a href="https://x.com/yajiwhat" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="Twitter">
            <FiTwitter size={22} />
          </a>
          <a href="https://github.com/yajiiiii" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="GitHub">
            <FiGithub size={22} />
          </a>
        </div>

        <p className="text-xs text-white/45">
          &copy; 2026 Jayflix. All rights reserved. This site does not store any files on its server. created by yaji
        </p>
      </div>
    </footer>
  );
}
