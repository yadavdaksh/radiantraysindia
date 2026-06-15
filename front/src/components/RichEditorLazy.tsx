import { Suspense, lazy } from "react";

const RichEditorInner = lazy(() =>
  import("./RichEditor").then(m => ({ default: m.RichEditor }))
);

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  height?: number;
}

export function RichEditorLazy({ value, onChange, placeholder, height = 280 }: Props) {
  return (
    <Suspense fallback={
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 animate-pulse" style={{ height }} />
    }>
      <RichEditorInner value={value} onChange={onChange} placeholder={placeholder} height={height} />
    </Suspense>
  );
}
