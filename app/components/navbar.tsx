"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      
      {/* Left side: logo/site name*/ }
      <Link href="/" className="font-semibold text-lg">
        Supertime
      </Link>

      {/* Middle: menu links */}
     <div className="flex items-center gap-6">
        <Link href="/">Home</Link>
        <Link href="/bookings">Bookings</Link>
        <Link href="/profile">Profile</Link>
      </div>

      {/* Right side: login state*/ }
      <div>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">
              Login
            </button>
          </SignInButton>
        </SignedOut>
      </div>

    </nav>
  );
}