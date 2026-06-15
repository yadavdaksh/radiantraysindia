"use client";

import type { ReactNode } from "react";
import { PageHeader } from "./ui/page-header";

export function SiteShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <PageHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
