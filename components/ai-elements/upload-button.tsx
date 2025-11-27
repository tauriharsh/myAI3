"use client";

import { Button } from "@/components/ui/button";
import { Paperclip, Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Success!
      setUploadedFileName(file.name);
      setUploadSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadedFileName(null);
      }, 5000);

      // Reset input
      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isUploading}
          id="pdf-upload"
        />
        <Button
          variant="outline"
          size="default"
          disabled={isUploading}
          className="gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm h-10 px-4 text-sm font-medium"
          asChild
        >
          <label htmlFor="pdf-upload" className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Uploaded
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4" />
                Upload PDF
              </>
            )}
          </label>
        </Button>
      </div>

      {/* Success Message */}
      {uploadSuccess && uploadedFileName && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-left-2">
          <Check className="h-4 w-4" />
          <span className="font-medium">{uploadedFileName}</span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-left-2">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
