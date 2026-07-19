"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AeroSagaLogo from './AeroSagaLogo';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Airplane News', href: '/news/airplane-news' }, // Maps directly to [category]
    { name: 'Airport News', href: '/news/airport-news' },   // Maps directly to [category]
  ];

  return (
    <nav className="w-full sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
      {/* Container matching your page constraints */}
      <div className="max-w-[80%] mx-auto flex items-center justify-between py-4 px-2">
        
        {/* Brand Logo Wrapper */}
        <Link href="/" className="flex items-center" aria-label="Aero Saga Home">
          <AeroSagaLogo />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 font-serif text-base font-semibold tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {link.name}
                {/* Thick News-Style Orange Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-t-sm" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Button Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none z-50"
          aria-label="Toggle navigation menu"
        >
          <span
            className={`block w-6 h-0.5 bg-slate-800 transition-transform duration-300 ease-in-out ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-slate-800 transition-opacity duration-300 ease-in-out ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-slate-800 transition-transform duration-300 ease-in-out ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu Panel Layer */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col space-y-4 px-6 py-6 bg-white shadow-xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)} // Auto-closes panel on route switch
                className={`flex items-center justify-between py-2 font-serif text-lg font-bold ${
                  isActive ? 'text-orange-600 border-l-4 border-orange-600 pl-3' : 'text-slate-600 pl-3'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
