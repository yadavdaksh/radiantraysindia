"use client";

import { useEffect, useState } from "react";
import { apiClient } from "./api-client";
import { industries as mockIndustries } from "./site-data";

export interface NavIndustry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

let _cache: NavIndustry[] | null = null;
let _fetching = false;
const _subs: Array<(cats: NavIndustry[]) => void> = [];

function notify(cats: NavIndustry[]) {
  _subs.forEach((fn) => fn(cats));
  _subs.length = 0;
}

const FALLBACK: NavIndustry[] = mockIndustries.map((c) => ({
  id: c.slug, name: c.name, slug: c.slug,
  description: c.summary,
}));

async function fetchOnce(): Promise<NavIndustry[]> {
  if (_cache) return _cache;
  if (_fetching) return new Promise((res) => _subs.push(res));
  _fetching = true;
  try {
    const r = await apiClient.get("/industries");
    const data: NavIndustry[] = r.data.data || [];
    _cache = data.length ? data : FALLBACK;
    notify(_cache);
    return _cache;
  } catch {
    _cache = FALLBACK;
    notify(_cache);
    return _cache;
  } finally {
    _fetching = false;
  }
}

export function useIndustriesNav() {
  const [industries, setIndustries] = useState<NavIndustry[]>(_cache || []);

  useEffect(() => {
    if (_cache) { setIndustries(_cache); return; }
    fetchOnce().then(setIndustries);
  }, []);

  return industries;
}
