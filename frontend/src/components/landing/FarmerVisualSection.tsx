"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tractor, Sprout, Truck, Warehouse, ArrowRight, Users, Globe, Shield } from "lucide-react";

const farmerFeatures = [
  {
    icon: Tractor,
    title: "Smart Machinery",
    description: "AI-powered equipment monitoring and predictive maintenance for your farm operations.",
  },
  {
    icon: Sprout,
    title: "Crop Intelligence",
    description: "Real-time analytics on soil health, weather patterns, and yield predictions.",
  },
  {
    icon: Truck,
    title: "Logistics Network",
    description: "Connected supply chain with transparent pricing and efficient delivery routes.",
  },
  {
    icon: Warehouse,
    title: "Storage Solutions",
    description: "Secure grain storage with IoT monitoring and quality preservation technology.",
  },
];

const stats = [
  { value: "50K+", label: "Active Farmers", icon: Users },
  { value: "120+", label: "Countries", icon: Globe },
  { value: "$2.4B+", label: "Value Secured", icon: Shield },
];

const FarmerVisualSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-[var(--surface-muted)] to-white overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232f7a42' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="content-wrap px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="eyebrow">Empowering Agriculture</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Transforming Farm Operations with Smart Technology
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From precision planting to harvest logistics, we provide the infrastructure that modern farmers need to thrive.
          </p>
        </motion.div>

        {/* Visual grid with icons representing farm operations */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {farmerFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -4 }}
            >
              {/* Icon container */}
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--brand)] group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-[var(--brand-strong)] group-hover:text-white transition-colors" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>

              {/* Hover decoration */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-[var(--brand)]" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="grid gap-4 sm:grid-cols-3 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex items-center justify-center gap-3 bg-white rounded-2xl p-4 border border-[var(--border)]"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-2 rounded-xl bg-[var(--brand-soft)]">
                <stat.icon className="w-5 h-5 text-[var(--brand-strong)]" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="btn-primary sm:w-auto">
              Start Your Journey
            </Link>
            <Link href="#features" className="btn-secondary sm:w-auto">
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{
        clipPath: "polygon(0 100%, 100% 100%, 100% 30%, 0 100%)",
      }} />
    </section>
  );
};

export default FarmerVisualSection;