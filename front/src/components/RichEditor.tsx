import { useEffect, useRef } from "react";
import { Jodit } from "jodit";
import "jodit/es2021/jodit.min.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002/api/v1";

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  height?: number;
}

// Strip HTML for empty comparison
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

export function RichEditor({ value, onChange, placeholder = "Write content here...", height = 280 }: RichEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Jodit | null>(null);
  const skipRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ta = document.createElement("textarea");
    // Set initial value — may be empty on edit pages (data loads after mount)
    ta.value = value || "";
    // Hide raw textarea — Jodit will replace it; this prevents flash of raw HTML
    ta.style.display = "none";
    containerRef.current.appendChild(ta);

    const editor = Jodit.make(ta, {
      height,
      placeholder,
      theme: "default",
      toolbarSticky: false,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      disablePlugins: ["speech-recognize", "video"],
      buttons: [
        "bold", "italic", "underline", "strikethrough", "|",
        "ul", "ol", "|",
        "h1", "h2", "h3", "|",
        "left", "center", "right", "|",
        "link", "image", "|",
        "table", "|",
        "undo", "redo", "|",
        "source",
      ],
      uploader: {
        url: `${API_BASE}/uploads`,
        format: "json",
        withCredentials: true,
        prepareData(data: FormData) {
          data.append("folder", "editor");
          return data;
        },
        isSuccess(resp: any) {
          return !!resp?.data?.url;
        },
        process(resp: any) {
          return {
            files: resp?.data?.url ? [resp.data.url] : [],
            path: resp?.data?.url || "",
            baseurl: "",
            error: resp?.data?.url ? 0 : 1,
            msg: "",
          };
        },
        defaultHandlerSuccess(this: any, data: { files: string[] }) {
          if (data.files?.[0]) {
            this.s.insertImage(data.files[0]);
          }
        },
      },
    } as any);

    editorRef.current = editor;

    // Mark ready after a tick so sync useEffect can safely set value
    requestAnimationFrame(() => { readyRef.current = true; });

    editor.events.on("change", (newVal: string) => {
      if (!skipRef.current) onChange(newVal);
    });

    return () => {
      readyRef.current = false;
      try { editor.destruct(); } catch { }
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when value prop changes (e.g. edit page loads data after mount)
  useEffect(() => {
    const apply = () => {
      if (!editorRef.current) return;
      const currentText = stripHtml(editorRef.current.value || "");
      const newText = stripHtml(value || "");
      if (currentText !== newText) {
        skipRef.current = true;
        editorRef.current.value = value || "";
        skipRef.current = false;
      }
    };

    if (readyRef.current) {
      apply();
    } else {
      // Editor still initializing — retry after it's ready
      const t = setTimeout(apply, 150);
      return () => clearTimeout(t);
    }
  }, [value]);

  return <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-200" />;
}
