import React from "react";

import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";
import { Ticket } from "@/features/queue/types";

import { getPriorityTextColorClass } from "@/utils/priorityVisuals";

interface ForwardModalProps {
  show: boolean;
  currentCall?: Ticket;
  attendants: { guiche: string; alias?: string | null; groupName?: string | null; attendantName?: string }[];
  currentGuiche: string;
  onClose: () => void;
  onForward: (ticketId: string, target: string, type: "single" | "group") => void;
}

function SlidingGroupDetails({ 
  items, 
  currentGuiche 
}: { 
  items: { guiche: string; alias?: string | null; attendantName?: string }[];
  currentGuiche: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const formattedText = items
    .map((a) => {
      const isSelf = a.guiche === currentGuiche;
      const label = a.alias || a.guiche;
      if (isSelf) return `${label} (Você)`;
      return `${label}${a.attendantName ? ` (${a.attendantName})` : ""}`;
    })
    .join("  •  ");

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && measureRef.current) {
        setIsOverflowing(measureRef.current.offsetWidth > containerRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [items, currentGuiche]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden relative text-xs font-medium text-emerald-100">
      <span ref={measureRef} className="absolute invisible whitespace-nowrap pointer-events-none left-0 top-0">
        {formattedText}
      </span>

      {isOverflowing ? (
        <div className="flex w-max animate-marquee-continuous whitespace-nowrap">
          <span className="pr-8">{formattedText}</span>
          <span className="pr-8">{formattedText}</span>
        </div>
      ) : (
        <div className="truncate w-full">
          {formattedText}
        </div>
      )}
    </div>
  );
}

export default function ForwardModal({
  show,
  currentCall,
  attendants,
  currentGuiche,
  onClose,
  onForward,
}: ForwardModalProps) {
  const [activeTab, setActiveTab] = React.useState<"single" | "group">("single");

  // Reset tab on close or open
  React.useEffect(() => {
    if (!show) {
      setTimeout(() => setActiveTab("single"), 300);
    }
  }, [show]);

  // Only show active guiches (occupied by an attendant) and not the current one for individual target tab
  const activeAttendants = attendants.filter(
    (a) => a.guiche !== currentGuiche && !!a.attendantName
  );

  // Group attendants by groupName (including the current user if active in the group)
  const groupedAttendants = React.useMemo(() => {
    const groups: Record<string, typeof attendants> = {};
    attendants.filter((a) => !!a.attendantName).forEach(a => {
      if (a.groupName) {
        if (!groups[a.groupName]) groups[a.groupName] = [];
        groups[a.groupName].push(a);
      }
    });
    return groups;
  }, [attendants]);

  return (
    <Modal 
      isOpen={show && !!currentCall} 
      onClose={onClose}
      zIndex="z-[60]"
      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-0"
    >
      {currentCall && (
        <>
          <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
              <div>
                <h3 className={`text-2xl font-black uppercase tracking-tight ${getPriorityTextColorClass(currentCall.priority)}`}>
                  Encaminhar Senha: {currentCall.ticketNumber}
                </h3>
                <p className="text-sm font-medium text-sefaz-accent/60">
                  Selecione o guichê de destino
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 pt-4">
              <div className="flex gap-2 mb-6 p-1 bg-emerald-50/50 rounded-2xl w-full">
                <button
                  onClick={() => setActiveTab("single")}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "single"
                      ? "bg-white text-sefaz-accent shadow-sm border border-emerald-100/50"
                      : "text-sefaz-accent/50 hover:bg-white/50 hover:text-sefaz-accent/70"
                  }`}
                >
                  Guichês
                </button>
                <button
                  onClick={() => setActiveTab("group")}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === "group"
                      ? "bg-white text-sefaz-accent shadow-sm border border-emerald-100/50"
                      : "text-sefaz-accent/50 hover:bg-white/50 hover:text-sefaz-accent/70"
                  }`}
                >
                  Grupos
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === "single" ? (
                  activeAttendants.length === 0 ? (
                    <div className="col-span-2 sm:col-span-3 text-center py-6">
                      <p className="text-sefaz-accent/60 font-medium">Nenhum outro guichê disponível.</p>
                    </div>
                  ) : (
                    activeAttendants.map(({ guiche, alias, attendantName }) => (
                      <button
                        key={guiche}
                        onClick={() => onForward(currentCall.id, guiche, "single")}
                        className="p-4 bg-emerald-50/50 hover:bg-emerald-100/50 border-2 border-emerald-100 rounded-2xl text-left transition-all group cursor-pointer flex flex-col"
                      >
                        <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest mb-1 truncate w-full" title={guiche}>
                          {alias || guiche}
                        </p>
                        <p className="text-sm font-black text-sefaz-dark group-hover:text-sefaz-accent transition-colors truncate w-full" title={attendantName}>
                          {attendantName}
                        </p>
                      </button>
                    ))
                  )
                ) : (
                  Object.keys(groupedAttendants).length === 0 ? (
                    <div className="col-span-2 sm:col-span-3 text-center py-6">
                      <p className="text-sefaz-accent/60 font-medium">Nenhum grupo com guichês disponíveis.</p>
                    </div>
                  ) : (
                    Object.entries(groupedAttendants).map(([groupName, groupAttendants]) => (
                      <button
                        key={groupName}
                        onClick={() => onForward(currentCall.id, groupName, "group")}
                        className="col-span-2 sm:col-span-3 p-4 bg-sefaz-accent hover:bg-sefaz-dark text-white rounded-2xl text-left transition-all group cursor-pointer flex flex-col"
                      >
                        <div className="flex justify-between items-center w-full mb-2">
                          <p className="text-sm font-black uppercase tracking-widest truncate w-full">
                            Grupo: {groupName}
                          </p>
                          <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ml-2">
                            {groupAttendants.length} {groupAttendants.length === 1 ? "Guichê" : "Guichês"}
                          </span>
                        </div>
                        <SlidingGroupDetails items={groupAttendants} currentGuiche={currentGuiche} />
                      </button>
                    ))
                  )
                )}
              </div>
            </div>
        </>
      )}
    </Modal>
  );
}
