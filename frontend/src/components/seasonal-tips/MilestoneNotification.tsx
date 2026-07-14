'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/components/ui/types';
import { useSeasonalTipsStore } from '@/hooks/useSeasonalTips';
import { TIP_TYPE_LABELS } from '@/lib/api/seasonal-tips';
import { X, Sparkles } from 'lucide-react';

export function MilestoneNotification() {
  const { milestoneTips, vaultProgress, fetchMilestoneTips } =
    useSeasonalTipsStore();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    if (vaultProgress.milestoneReached) {
      fetchMilestoneTips(vaultProgress.milestoneReached);
    }
  }, [vaultProgress.milestoneReached, fetchMilestoneTips]);

  const visibleTips = milestoneTips.filter((tip) => !dismissed.has(tip.id));

  if (visibleTips.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visibleTips.map((tip, idx) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{
              duration: 0.4,
              delay: idx * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Card
              variant="elevated"
              className={cn(
                'border-l-4 border-l-harvest-green-500',
                'bg-gradient-to-r from-harvest-green-50 to-white',
              )}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-harvest-green-500 text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm" isDot>
                        Milestone Reached
                      </Badge>
                      <Badge variant="default" size="sm" isPill>
                        {TIP_TYPE_LABELS[tip.tipType]}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {tip.content}
                    </p>
                    {vaultProgress.progressPercent > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Vault Progress</span>
                          <span className="font-medium text-harvest-green-700">
                            {vaultProgress.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${vaultProgress.progressPercent}%`,
                            }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-harvest-green-400 to-harvest-green-600 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setDismissed((prev) => new Set(prev).add(tip.id))
                    }
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
