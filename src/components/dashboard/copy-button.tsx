"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-amber-500 px-3 py-1 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? "Tersalin!" : "Salin"}
    </button>
  );
}