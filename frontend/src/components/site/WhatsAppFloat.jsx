import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function WhatsAppFloat() {
  const [phone, setPhone] = useState("6281234567890");
  const location = useLocation();

  useEffect(() => {
    api
      .get("/pages/contact")
      .then((r) => {
        const wa = r.data?.content?.info?.whatsapp;
        if (wa) setPhone(String(wa).replace(/\D/g, ""));
      })
      .catch(() => {});
  }, []);

  if (location.pathname.startsWith("/admin")) return null;

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    "Hello PT. Murfy Alam Indonesia, I would like a quotation for Sukabumi Green Stone."
  )}`;

  return (
    <motion.a
      data-testid="whatsapp-float-btn"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-moss text-white shadow-lg shadow-black/40 transition-colors duration-300 hover:bg-mosslight"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08 }}
    >
      <MessageCircle className="h-6 w-6" />
    </motion.a>
  );
}
