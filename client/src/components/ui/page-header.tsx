import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 space-y-2 mt-4">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">
        Radiant Rays Pvt. Ltd.
      </p>
      <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
