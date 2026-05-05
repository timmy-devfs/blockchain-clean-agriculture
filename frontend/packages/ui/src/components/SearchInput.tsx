"use client";

import React, { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = "Tìm kiếm...",
  value = "",
  onSearch,
  debounceMs = 300,
  className = "",
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(v), debounceMs);
  };

  const handleClear = () => {
    setLocalValue("");
    onSearch("");
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="pointer-events-none absolute left-3 text-gray-400">
        🔍
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition text-xs"
          aria-label="Xóa"
        >
          ✕
        </button>
      )}
    </div>
  );
}
