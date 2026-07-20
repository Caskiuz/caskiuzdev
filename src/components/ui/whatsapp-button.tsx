"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  config?: Record<string, string>;
}

export function WhatsAppButton({ config = {} }: WhatsAppButtonProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const phoneNumber = c("contact_whatsapp", "584262931869");
  const message = encodeURIComponent(
    c("contact_whatsapp_message", "¡Hola Caskiuz! 👋 Vi tu portfolio y me interesa trabajar contigo.")
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#25D366] hover:bg-[#22c55e] text-white font-medium rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-[#25D366]/50 transition-all duration-300 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
      </span>
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm">WhatsApp</span>
    </motion.a>
  );
}