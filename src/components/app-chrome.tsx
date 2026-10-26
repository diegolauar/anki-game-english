"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

const FOCUS_PATH_PREFIXES = ["/", "/login", "/forgot-password", "/reset-password", "/review"];

function isFocusPath(pathname: string): boolean {
  if (FOCUS_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  // /conversations/[id] (the live chat) is a focus screen, but /conversations/new
  // and /conversations/[id]/results keep the bottom nav.
  return /^\/conversations\/(?!new$)[^/]+$/.test(pathname);
}

export function AppChrome({
  pendingReviewCount,
  children,
}: {
  pendingReviewCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = !isFocusPath(pathname);

  return (
    <>
      <div className={showNav ? "pb-24" : undefined}>{children}</div>
      {showNav && <BottomNav pendingReviewCount={pendingReviewCount} />}
    </>
  );
}
