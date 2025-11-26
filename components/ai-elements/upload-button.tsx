"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      toast.success(`Learned ${data.chunks} new chunks from ${file.name}!`);
    } catch (error) {
      toast.error("Failed to ingest document.");
      console.error(error);
    } finally {
      setIsUploading(false);
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
          className="cursor-pointer gap-2"
          asChild
          disabled={isUploading}
        >
          <span>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {isUploading ? "Ingesting..." : "Upload Knowledge"}
          </span>
        </Button>
      </label>
    </div>
  );
}
