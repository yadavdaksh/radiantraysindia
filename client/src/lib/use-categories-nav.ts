"use client";

import { useEffect, useState } from "react";
import { apiClient } from "./api-client";
import { categories as mockCategories } from "./site-data";

export interface SubCat {
  id: string;
  name: string;
  slug: string;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  subCategories: SubCat[];
}

// Module-level cache so only one fetch happens per session
let _cache: NavCategory[] | null = null;
let _fetching = false;
const _subs: Array<(cats: NavCategory[]) => void> = [];

function notify(cats: NavCategory[]) {
  _subs.forEach((fn) => fn(cats));
  _subs.length = 0;
}

const FALLBACK: NavCategory[] = mockCategories.map((c) => ({
  id: c.slug, name: c.name, slug: c.slug,
  description: c.summary, subCategories: [],
}));

async function fetchOnce(): Promise<NavCategory[]> {
  if (_cache) return _cache;
  if (_fetching) return new Promise((res) => _subs.push(res));
  _fetching = true;
  try {
    const r = await apiClient.get("/public/categories");
    const data: NavCategory[] = r.data.data || [];
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

export function useCategoriesNav() {
  const [categories, setCategories] = useState<NavCategory[]>(_cache || []);

  useEffect(() => {
    if (_cache) { setCategories(_cache); return; }
    fetchOnce().then(setCategories);
  }, []);

  return categories;
}
