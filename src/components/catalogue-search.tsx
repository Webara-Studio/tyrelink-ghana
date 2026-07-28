"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TyreProduct = {
  id: string;
  brand: string;
  model: string;
  width_mm: number;
  aspect_ratio: number;
  rim_size: number;
  category: string;
  wet_grip_rating: string | null;
  mileage_notes: string | null;
};

function formatSize(product: TyreProduct) {
  return `${product.width_mm}/${product.aspect_ratio} R${product.rim_size}`;
}

export function CatalogueSearch() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts(search = "") {
    setLoading(true);
    setError(null);

    let request = supabase
      .from("tyre_products")
      .select("id, brand, model, width_mm, aspect_ratio, rim_size, category, wet_grip_rating, mileage_notes")
      .eq("active", true)
      .order("category")
      .limit(12);

    const sizeMatch = search.trim().match(/^(\d{3})\s*\/\s*(\d{2})\s*r\s*(\d{2})$/i);
    if (sizeMatch) {
      request = request
        .eq("width_mm", Number(sizeMatch[1]))
        .eq("aspect_ratio", Number(sizeMatch[2]))
        .eq("rim_size", Number(sizeMatch[3]));
    } else if (search.trim()) {
      const safeSearch = search.trim().replace(/[(),]/g, " ");
      request = request.or(`brand.ilike.%${safeSearch}%,model.ilike.%${safeSearch}%`);
    }

    const { data, error: queryError } = await request;
    if (queryError) {
      setError(queryError.message);
      setProducts([]);
    } else {
      setProducts((data ?? []) as TyreProduct[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearched(true);
    void loadProducts(query);
  }

  return (
    <div className="catalogue-search" aria-live="polite">
      <form className="search-form" onSubmit={submit}>
        <label htmlFor="tyre-search">Search the live catalogue</label>
        <div className="search-input-row">
          <input
            id="tyre-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Brand or size, e.g. 205/55 R16"
            autoComplete="off"
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {loading && <p className="catalogue-status">Checking TyreLink stock…</p>}
      {error && <p className="catalogue-status catalogue-error">Could not reach the catalogue: {error}</p>}
      {!loading && !error && searched && products.length === 0 && (
        <p className="catalogue-status">No live matches yet. Try a different brand or tyre size.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card-top"><span>{product.category.replace("_", " ")}</span><strong>{formatSize(product)}</strong></div>
              <h3>{product.brand} <em>{product.model}</em></h3>
              <p>{product.mileage_notes ?? "Everyday performance for Ghanaian roads."}</p>
              <small>Wet grip: {product.wet_grip_rating ?? "—"}</small>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
