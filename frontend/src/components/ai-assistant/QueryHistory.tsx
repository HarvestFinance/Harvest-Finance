'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useQueryHistory } from '../../hooks/useQueryHistory';
import { QueryHistoryCard } from './QueryHistoryCard';

interface QueryHistoryProps {
  onRerun?: (query: string) => void;
}

export function QueryHistory({ onRerun }: QueryHistoryProps) {
  const { history, isLoading, error, search, setSearch, removeItem } =
    useQueryHistory();

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-green-100 shadow-md overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-green-50">
        <h2 className="text-base font-bold text-green-900">Query History</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your past AI consultations</p>
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries or responses..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 placeholder-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-green-300 border-t-green-600 rounded-full"
            />
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <span className="text-4xl mb-3">🌱</span>
            <p className="text-sm font-medium text-green-800">
              {search ? 'No results found' : 'No queries yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search
                ? 'Try a different search term'
                : 'Ask the AI Assistant a question to get started'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {history.map((item) => (
            <QueryHistoryCard
              key={item.id}
              item={item}
              onDelete={removeItem}
              onRerun={(query) => onRerun && onRerun(query)}
            />
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && history.length > 0 && (
        <div className="px-5 py-3 border-t border-green-50 text-xs text-gray-400">
          {history.length} {history.length === 1 ? 'record' : 'records'}
          {search && ' matching your search'}
        </div>
      )}
    </div>
  );
}
