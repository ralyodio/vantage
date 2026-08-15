import { useState } from 'react';
import { HiSearch } from 'react-icons/hi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} role="search">
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-[#111113]/92 backdrop-blur-xl p-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-colors duration-200 ${
          focused ? 'border-white/25' : 'border-white/[0.08]'
        }`}
      >
        <HiSearch
          className={`ml-2 w-5 h-5 shrink-0 transition-colors duration-200 ${
            focused ? 'text-zinc-300' : 'text-zinc-600'
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Steam ID, vanity, or profile link…"
          aria-label="Search player"
          disabled={isLoading}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50 sm:text-lg"
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="inline-flex h-10 w-24 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white text-xs font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:w-28"
        >
          {isLoading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
          ) : (
            <HiSearch className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="tabular-nums">
            {isLoading ? 'Working' : 'Lookup'}
          </span>
        </button>
      </div>
    </form>
  );
}
