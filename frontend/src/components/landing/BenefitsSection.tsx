"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui";
import { Leaf, ShieldCheck, Globe, BarChart3, Sprout } from "lucide-react";

const benefits = [
    {
        title: "Sustainable Finance",
        description:
            "Invest in eco-friendly opportunities that promote long-term environmental and financial growth.",
        icon: Leaf,
    },
    {
        title: "Transparent Yield Farming",
        description:
            "Clear insights into APY, rewards, and performance with no hidden complexities.",
        icon: BarChart3,
    },
    {
        title: "Secure Smart Contracts",
        description:
            "Audited and reliable contracts ensuring your funds remain safe at all times.",
        icon: ShieldCheck,
    },
    {
        title: "Global Reach",
        description:
            "Access decentralized financial tools from anywhere in the world.",
        icon: Globe,
    },
    {
        title: "Growth-Oriented Ecosystem",
        description:
            "A platform designed to help your investments grow steadily.",
        icon: Sprout,
    },
];

export const BenefitsSection = () => {
    return (
        <section className="py-24 bg-white dark:bg-black relative overflow-hidden">
            {/* Background (from your version) */}
            <div className="absolute -left-40 top-20 w-80 h-80 bg-green-200/40 dark:bg-green-900/20 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

            <Container size="lg">
                <div className="flex flex-col gap-16 items-center">
                    {/* LEFT SIDE (unchanged from yours) */}
                    <div className="flex-1 text-center">
                        <motion.h2
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold tracking-tight  text-zinc-900 dark:text-zinc-50 mb-6 leading-tight"
                        >
                            Why Choose Harvest Finance?
                            <br />
                            <span className="text-green-600 dark:text-green-500">
                                Built for sustainable growth.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-zinc-600 dark:text-zinc-400 mb-8"
                        >
                            Harvest Finance empowers users with secure,
                            transparent, and globally accessible financial tools
                            designed for long-term growth.
                        </motion.p>
                    </div>

                    {/* RIGHT SIDE (card-style benefits) */}
                    <div className="flex-1 grid gap-6 sm:grid-cols-3">
                        {benefits.map((benefit, index) => {
                            const Icon = benefit.icon;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 25 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.08,
                                    }}
                                    className="group"
                                >
                                    {/* CARD */}
                                    <div className="h-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                        {/* ICON */}
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <Icon size={20} />
                                        </div>

                                        {/* CONTENT */}
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                                            {benefit.title}
                                        </h3>

                                        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </Container>
        </section>
    );
};
