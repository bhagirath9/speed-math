"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

/**
 * SessionProviderWrapper wraps children components with the NextAuth client SessionProvider.
 * A custom basePath is configured here to align with the /speed-math/ routing subpath configuration.
 */
export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider basePath="/speed-math/api/auth">{children}</SessionProvider>;
}

