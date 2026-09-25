"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { containerVariants, itemVariants } from "../variants";
import { AFFILIATE_FAQS } from "@/lib/affiliate-content";

export function AffiliateFaq() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-14"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold tracking-tight">
            Preguntas <span className="metal-text">frecuentes</span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="space-y-3"
        >
          {AFFILIATE_FAQS.map((faq) => (
            <motion.details
              key={faq.q}
              variants={itemVariants}
              className="metal-card rounded-xl group"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-aff-cyan shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
