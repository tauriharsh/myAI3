"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks (safely under 4.5MB limit)

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 50MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const totalSize = arrayBuffer.byteLength;
      const chunks: Blob[] = [];

      // Step 2: Split into chunks
      for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
        const chunk = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
        chunks.push(new Blob([chunk], { type: "application/octet-stream" }));
      }

      console.log(`Uploading ${file.name} in ${chunks.length} chunks...`);

      // Step 3: Upload each chunk
      const chunkIds: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const formData = new FormData();
        formData.append("chunk", chunks[i]);
        formData.append("filename", file.name);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", chunks.length.toString());

        const res = await fetch("/api/ingest/upload-chunk", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Chunk ${i + 1} failed: ${error}`);
        }

        const data = await res.json();
        chunkIds.push(data.chunkId);

        // Update progress
        const progressPercent = Math.round(((i + 1) / chunks.length) * 50); // 50% for upload
        setProgress(progressPercent);
      }

      // Step 4: Process the complete file
      toast.info("Processing PDF...", { duration: 2000 });
      
      const processRes = await fetch("/api/ingest/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          chunkIds,
          totalChunks: chunks.length,
        }),
      });

      if (!processRes.ok) {
        const error = await processRes.text();
        throw new Error(`Processing failed: ${error}`);
      }

      const result = await processRes.json();
      
      setProgress(100);
      toast.success(`Success! Added ${result.totalChunks} chunks from ${file.name}.`);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
      setProgress(0);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer gap-2 border shadow-sm hover:bg-accent"
          asChild
          disabled={isUploading}
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">{progress}%</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Upload PDF
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}
