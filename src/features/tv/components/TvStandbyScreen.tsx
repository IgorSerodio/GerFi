import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { TvSettings } from "@/features/tv/types";

interface TvStandbyScreenProps {
  tvSettings: TvSettings;
  slideIndex: number;
  slides: { title: string; text: string; type: string }[];
}

export default function TvStandbyScreen({ tvSettings, slideIndex, slides }: TvStandbyScreenProps) {
  if (tvSettings.uploadedFiles && tvSettings.uploadedFiles.length > 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <AnimatePresence mode="wait">
          <motion.img
            key={slideIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            src={tvSettings.uploadedFiles[slideIndex]}
            className="w-full h-full object-contain"
            alt="TV Slide"
          />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000"
          fill={true}
          style={{ objectFit: 'cover' }}
          className="opacity-10"
          alt="Default Background"
        />
      </div>
      <div
        className="relative z-20 text-center flex flex-col items-center justify-center w-full h-full"
        style={{ padding: "4cqh 8cqh", gap: "4cqh" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="flex flex-col items-center justify-center w-full"
            style={{ gap: "3cqh" }}
          >
            <div
              className="bg-emerald-500 rounded-full"
              style={{ width: "12cqh", height: "1cqh" }}
            />
            <h2
              className="font-black text-white tracking-tighter leading-none drop-shadow-2xl uppercase max-w-4xl"
              style={{ fontSize: "10cqh" }}
            >
              {slides.length > 0 ? slides[slideIndex % slides.length]?.title : "BEM-VINDO"}
            </h2>
            <p
              className="text-emerald-100/80 font-light leading-relaxed max-w-5xl mx-auto italic tracking-tight"
              style={{ fontSize: "4.5cqh" }}
            >
              {slides.length > 0 ? slides[slideIndex % slides.length]?.text : "Aguarde o seu chamado..."}
            </p>
            <div
              className="bg-emerald-500/20 rounded-full"
              style={{
                width: "12cqh",
                height: "1cqh",
                marginTop: "1cqh",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
