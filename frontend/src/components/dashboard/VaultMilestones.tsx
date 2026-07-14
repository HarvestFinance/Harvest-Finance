'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Badge, Stack } from '@/components/ui';
import { CheckCircle2, Circle, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

interface Milestone {
  name: string;
  target: number;
  achieved: boolean;
}

interface VaultMilestonesProps {
  milestones: Milestone[];
  progress: number;
}

export const VaultMilestones: React.FC<VaultMilestonesProps> = ({ 
  milestones, 
  progress 
}) => {
  return (
    <Card variant="default">
      <CardHeader 
        title="Seasonal Milestones" 
        action={<Badge variant="primary">{progress}% Complete</Badge>}
      />
      <CardBody>
        <div className="relative pt-4 pb-8">
          {/* Progress Bar Background */}
          <div className="absolute top-8 left-0 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-harvest-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Milestone Markers */}
          <div className="relative flex justify-between">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className={`
                  w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 transition-colors duration-300
                  ${milestone.achieved 
                    ? 'bg-harvest-green-500 border-harvest-green-100 text-white' 
                    : 'bg-white border-gray-100 text-gray-300'}
                `}>
                  {milestone.achieved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className={`text-xs font-semibold ${milestone.achieved ? 'text-harvest-green-700' : 'text-gray-400'}`}>
                    {milestone.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {milestone.target}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Stack gap="sm" className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-harvest-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600">Current Phase: {
              milestones.findLast(m => m.achieved)?.name || 'Planning'
            }</span>
          </div>
          <p className="text-xs text-gray-500 italic">
            "Your crops are entering a critical growth phase. Ensure consistent moisture levels for optimal yield."
          </p>
        </Stack>
      </CardBody>
    </Card>
  );
};
