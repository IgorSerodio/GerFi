import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ticket } from "@/features/queue/types";;;
import { TvSettings } from "@/features/tv/types";

interface MainCallDisplayProps {
  isIdle: boolean;
  currentCall: Ticket | null;
  tvSettings: TvSettings;
  slideIndex: number;
  defaultSlides: { title: string; text: string; type: string }[];
  getPlaylistUrl: () => string;
}

export default function MainCallDisplay({
  isIdle,
  currentCall,
  tvSettings,
  slideIndex,
  defaultSlides,
  getPlaylistUrl,
}: MainCallDisplayProps) {
  return (
    <div className="flex-1 flex flex-col h-full justify-between min-h-0">
      <div
        className="flex-1 bg-white rounded-[60px] flex flex-col items-center justify-center border-b-[12px] border-emerald-500 shadow-2xl relative z-20 overflow-hidden min-h-0 w-full"
        style={{ containerType: "size" }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        </div>

        <AnimatePresence mode="wait">
          {!isIdle && currentCall ? (
            <motion.div
              key={`call-${currentCall.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -50 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center justify-center w-full h-full relative z-10 text-center"
              style={{ padding: "4cqh 8cqh", gap: "2.5cqh" }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center font-black uppercase tracking-[0.4em] drop-shadow-sm text-emerald-900"
                style={{ fontSize: "3.2cqh", gap: "1.5cqh" }}
              >
                <div
                  className="bg-red-500 rounded-full animate-ping"
                  style={{ width: "2cqh", height: "2cqh" }}
                />
                <span>SENHA CHAMADA</span>
              </motion.div>

              <div
                className={`relative leading-none font-black tracking-tighter ${
                  currentCall.priority === "Prioritário"
                    ? "text-red-600 drop-shadow-[0_20px_50px_rgba(220,38,38,0.3)]"
                    : "text-emerald-950 drop-shadow-[0_20px_50px_rgba(6,78,59,0.3)]"
                }`}
                style={{ fontSize: "28cqh" }}
              >
                {currentCall.ticketNumber}
              </div>

              <div
                className="w-full max-w-lg bg-emerald-100 rounded-full overflow-hidden"
                style={{
                  height: "1.2cqh",
                  marginTop: "0.5cqh",
                  marginBottom: "1.5cqh",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>

              <div className="flex items-center" style={{ gap: "6cqh" }}>
                <div className="flex flex-col items-center">
                  <span
                    className="font-black text-emerald-600/40 uppercase tracking-[0.3em]"
                    style={{ fontSize: "1.8cqh", marginBottom: "0.6cqh" }}
                  >
                    DIRIJA-SE AO
                  </span>
                  <div
                    className="flex items-baseline bg-emerald-950 text-white shadow-xl"
                    style={{
                      gap: "1cqh",
                      padding: "1.2cqh 4cqh",
                      borderRadius: "3cqh",
                    }}
                  >
                    <span
                      className="font-light tracking-widest opacity-60"
                      style={{ fontSize: "2.5cqh" }}
                    >
                      GUICHÊ
                    </span>
                    <span
                      className="font-black leading-none tracking-tighter"
                      style={{ fontSize: "9cqh" }}
                    >
                      {currentCall.guiche?.split(" ")[1] || "01"}
                    </span>
                  </div>
                </div>

                <div
                  className="w-px bg-emerald-100"
                  style={{ height: "10cqh" }}
                />

                <div className="text-left">
                  <span
                    className="font-black text-emerald-600/40 uppercase tracking-[0.3em] block"
                    style={{ fontSize: "1.8cqh", marginBottom: "0.6cqh" }}
                  >
                    ATENDENTE
                  </span>
                  <h3
                    className="font-black text-emerald-950 uppercase tracking-tighter max-w-sm leading-tight"
                    style={{ fontSize: "4.5cqh" }}
                  >
                    {currentCall.attendant}
                  </h3>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center relative bg-emerald-950 rounded-[45px] overflow-hidden"
            >
              {tvSettings.uploadedFiles.length > 0 ? (
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
              ) : tvSettings.videoUrl && tvSettings.videoUrl.length > 0 ? (
                <div className="w-full h-full">
                  <iframe
                    src={getPlaylistUrl()}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0">
                    <img
                      src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000"
                      className="w-full h-full object-cover opacity-10"
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
                          {defaultSlides[slideIndex].title}
                        </h2>
                        <p
                          className="text-emerald-100/80 font-light leading-relaxed max-w-5xl mx-auto italic tracking-tight"
                          style={{ fontSize: "4.5cqh" }}
                        >
                          {defaultSlides[slideIndex].text}
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
