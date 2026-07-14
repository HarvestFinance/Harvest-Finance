'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryHistoryItem } from '../../lib/api/ai-query-history-client';

interface QueryHistoryCardProps {
  item: QueryHistoryItem;
  onDelete: (id: string) => void;
  onRerun: (query: string) => void;
}

export function QueryHistoryCard({ item, onDelete, onRerun }: QueryHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-green-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-900 line-clamp-2">
            {item.query}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.vaultContext && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Vault
            </span>
          )}
          {item.seasonalData && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Seasonal
            </span>
          )}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-green-500 text-sm"
          >
            ▾
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-green-50">
              <p className="text-xs font-semibold text-green-600 mt-3 mb-1 uppercase tracking-wide">
                AI Response
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.response}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onRerun(item.query)}
                  className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  ↺ Re-run Query
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
