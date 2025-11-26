"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Client-only UploadButton that:
 * - Dynamically imports pdfjs in the browser (avoids server 'canvas' bundling)
 * - Extracts text using pdfjs (browser build)
 * - Smart-chunks text and uploads JSON chunks to /api/ingest
 *
 * Important: Do NOT import "pdfjs-dist" at top-level anywhere else in the repo.
 */

const CHUNK_CHAR_LIMIT = 200_000; // safe default
const CHUNK_OVERLAP = 500;
const CONCURRENCY = 3;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;

export default function UploadButton(): JSX.Element {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // dynamic import helper - loads pdfjs only in browser
  async function loadPdfJs() {
    // dynamic import ensures pdfjs-dist is not bundled server-side
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    // use CDN worker rather than bundling worker
    // note: pdfjsLib.version is available after import
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;
    return pdfjsLib;
  }

  async function extractTextFromPdfFile(file: File) {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((t: any) => (t.str ? t.str : "")).join(" ");
      pageTexts.push(pageText);
    }
    return pageTexts.join("\n\n");
  }

  function smartChunkText(text: string) {
    const chunks: string[] = [];
    let start = 0;
    const len = text.length;
    while (start < len) {
      let end = Math.min(start + CHUNK_CHAR_LIMIT, len);
      if (end < len) {
        const slice = text.slice(start, end);
        const lastPeriod = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("?\n"), slice.lastIndexOf("!\n"));
        const lastNewline = slice.lastIndexOf("\n");
        const cut = Math.max(lastPeriod, lastNewline);
        if (cut > Math.max(100, CHUNK_CHAR_LIMIT / 3)) {
          end = start + cut + 1;
        }
      }
      const chunkStart = Math.max(0, start - CHUNK_OVERLAP);
      const chunkText = text.slice(chunkStart, end).trim();
      chunks.push(chunkText);
      start = end;
    }
    return chunks.filter(Boolean);
  }

  async function uploadChunkWithRetry(payload: any, attempt = 1): Promise<any> {
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(()=>null);
        const errText = errPayload?.error ?? res.statusText;
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      return res.json();
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_MS * attempt));
        return uploadChunkWithRetry(payload, attempt + 1);
      }
      throw err;
    }
  }

  async function runConcurrent(tasks: (() => Promise<any>)[], concurrency = CONCURRENCY) {
    const results: any[] = [];
    let idx = 0;
    let active = 0;
    return new Promise<void>((resolve, reject) => {
      let hasError = false;
      async function next() {
        if (hasError) return;
        if (idx >= tasks.length && active === 0) return resolve();
        while (active < concurrency && idx < tasks.length) {
          const cur = idx++;
          active++;
          tasks[cur]()
            .then((r) => {
              results[cur] = r;
            })
            .catch((err) => {
              hasError = true;
              reject(err);
            })
            .finally(() => {
              active--;
              setProgress((p) => (p ? { ...p, done: (p.done ?? 0) + 1 } : { done: 1, total: tasks.length }));
              next();
            });
        }
      }
      next();
    }).then(() => results);
  }

  async function handleFileSelect(e?: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0] ?? fileRef.current?.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }

    setBusy(true);
    setProgress({ done: 0, total: 0 });

    try {
      // Extract text (loads pdfjs in browser only)
      const rawText = await extractTextFromPdfFile(file);
      if (!rawText || rawText.trim().length === 0) {
        alert("No textual content found in the PDF.");
        setBusy(false);
        return;
      }

      // Chunk and upload
      const chunks = smartChunkText(rawText);
      setProgress({ done: 0, total: chunks.length });

      const tasks = chunks.map((chunk, idx) => {
        const payload = { text: chunk, filename: file.name, chunk_index: idx, total_chunks: chunks.length };
        return () => uploadChunkWithRetry(payload);
      });

      await runConcurrent(tasks, CONCURRENCY);

      // optional completion ping
      try {
        await fetch("/api/ingest-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, total_chunks: chunks.length }),
        });
      } catch (e) {
        console.warn("ingest-complete failed", e);
      }

      alert(`Ingestion finished: ${file.name} (${chunks.length} chunks)`);
    } catch (err: any) {
      console.error("Upload/ingest failed", err);
      alert("Ingestion failed: " + (err?.message ?? String(err)));
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
      <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="flex items-center gap-2" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Ingesting{progress ? ` ${progress.done}/${progress.total}` : "..."}</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            <span>Upload Knowledge</span>
          </>
        )}
      </Button>
    </>
  );
}
