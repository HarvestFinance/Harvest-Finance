"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardBody, Container } from '@/components/ui';
import { Sprout, ShieldCheck, Gift, Lock, ArrowUpRight } from 'lucide-react';

const features = [
  {
    title: 'Yield Farming',
    description:
      'Grow your assets with battle-tested strategies that automatically seek the highest APY across leading DeFi protocols.',
    icon: Sprout,
    accent: 'from-emerald-400 to-green-600',
    iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    delay: 0,
  },
  {
    title: 'Smart Vaults',
    description:
      'Deposit once and let algorithmic vaults auto-compound your returns while dynamically managing risk exposure.',
    icon: ShieldCheck,
    accent: 'from-green-400 to-teal-600',
    iconBg: 'bg-green-500/10 group-hover:bg-green-500/20',
    iconColor: 'text-green-500',
    delay: 0.1,
  },
  {
    title: 'Automated Rewards',
    description:
      'Earn $FARM tokens and exclusive incentive boosts seamlessly by participating in the ecosystem and staking.',
    icon: Gift,
    accent: 'from-teal-400 to-cyan-600',
    iconBg: 'bg-teal-500/10 group-hover:bg-teal-500/20',
    iconColor: 'text-teal-500',
    delay: 0.2,
  },
  {
    title: 'Secure DeFi Protocols',
    description:
      'Audited smart contracts with multi-sig governance and timelocks ensure transparent, secure operations at all times.',
    icon: Lock,
    accent: 'from-harvest-green-400 to-harvest-green-700',
    iconBg: 'bg-harvest-green-500/10 group-hover:bg-harvest-green-500/20',
    iconColor: 'text-harvest-green-500',
    delay: 0.3,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  }),
};

const FeatureCard = ({
  feature,
}: {
  feature: (typeof features)[number];
}) => {
  const Icon = feature.icon;

  return (
    <motion.div
      custom={feature.delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={cardVariants}
      whileHover={{ y: -8 }}
      className="h-full group"
    >
      <Card
        className={`
          h-full relative overflow-hidden
          border border-zinc-200/80 dark:border-zinc-800
          bg-white dark:bg-zinc-950
          hover:shadow-2xl hover:shadow-harvest-green-500/10
          hover:border-harvest-green-300 dark:hover:border-harvest-green-800
          transition-all duration-500 ease-out
        `}
        padding="none"
      >
        {/* Top gradient accent bar */}
        <div
          className={`
            h-1 w-full bg-gradient-to-r ${feature.accent}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-500
          `}
        />

        {/* Hover glow background */}
        <div
          className={`
            absolute -top-24 -right-24 w-48 h-48 rounded-full
            bg-gradient-to-br ${feature.accent} opacity-0
            group-hover:opacity-[0.07] blur-3xl
            transition-opacity duration-700
          `}
        />

        <div className="p-6 md:p-8 relative z-10">
          <CardHeader className="pb-4">
            {/* Icon container with glow on hover */}
            <div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center
                ${feature.iconBg}
                transition-all duration-500
                ring-1 ring-zinc-100 dark:ring-zinc-800
                group-hover:ring-harvest-green-200 dark:group-hover:ring-harvest-green-900
                group-hover:shadow-lg group-hover:shadow-harvest-green-500/10
              `}
            >
              <Icon className={`w-7 h-7 ${feature.iconColor} transition-transform duration-500 group-hover:scale-110`} />
            </div>
          </CardHeader>

          <CardBody>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              {feature.title}
              <ArrowUpRight
                className="w-4 h-4 text-zinc-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              />
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[0.95rem]">
              {feature.description}
            </p>
          </CardBody>
        </div>
      </Card>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-32 bg-zinc-50/80 dark:bg-zinc-900/50 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-harvest-green-200/30 dark:bg-harvest-green-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

      <Container size="lg">
        {/* Section heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-harvest-green-100 dark:bg-harvest-green-950/60 text-harvest-green-700 dark:text-harvest-green-400 border border-harvest-green-200 dark:border-harvest-green-900 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-harvest-green-500 animate-pulse" />
              Core Features
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5"
          >
            Powerful tools for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-harvest-green-500 to-emerald-600">
              modern farmers
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed"
          >
            Everything you need to grow your digital wealth in one unified,
            elegant platform — secure, transparent, and fully automated.
          </motion.p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </Container>
    </section>
  );
};
