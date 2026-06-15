import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4">
      <div className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-4 leading-7 text-slate-600">
          The page you were looking for does not exist or has been moved.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
          Return home
        </Link>
      </div>
    </div>
  );
}

