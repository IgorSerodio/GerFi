"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { ArrowLeft, Menu, Printer, Landmark, History, Gavel, Accessibility, UserPlus, FileText, Info } from "lucide-react";
import { getQueueStateAction, issueTicketAction } from "@/features/queue/actions";
import { Ticket as TicketType, DbCategory } from "@/features/queue/types";
import { Session } from "next-auth";

import { Category, SearchResult } from "./types";
import TriageSidebar from "./TriageSidebar";
import CategoryGrid from "./CategoryGrid";
import PriorityModal from "./modals/PriorityModal";
import PrinterTestModal from "./modals/PrinterTestModal";
import TicketReceiptModal from "./modals/TicketReceiptModal";

import { Location } from "@/features/queue/types";
import LocationSelector from "@/components/ui/LocationSelector";

interface TriageDashboardProps {
  session: Session | null;
  initialLocations: Location[];
  initialCategories: DbCategory[];
}

export default function TriageDashboard({
  session,
  initialLocations,
  initialCategories,
}: TriageDashboardProps) {
  const [issuedTicket, setIssuedTicket] = useState<TicketType | null>(null);
  const [printing, setPrinting] = useState(false);
  const [recentIssues, setRecentIssues] = useState<TicketType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [queue, setQueue] = useState<TicketType[]>([]);
  const [history, setHistory] = useState<TicketType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPrinterTest, setShowPrinterTest] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("triage_locationId");
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationId(Number(stored));
    } else {
      setLocationId(1);
      localStorage.setItem("triage_locationId", "1");
    }
  }, []);

  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Landmark, History, Gavel, Accessibility, UserPlus, FileText, Info
  };

  const categories: Category[] = initialCategories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: iconMap[c.icon] || Info,
    color: c.color,
  }));

  const refreshState = async () => {
    if (locationId === null) return;
    const res = await getQueueStateAction(locationId);
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
  };

  useEffect(() => {
    if (locationId !== null) {
      setTimeout(() => {
        refreshState();
      }, 0);
    }
  }, [locationId]);

  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");
    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        refreshState();
      }, 0);
    });
    return () => {
      eventSource.close();
    };
  }, []);

  const selectService = (cat: Category) => {
    setSelectedCategory(cat);
  };

  const handleIssue = async (priority: "Normal" | "Prioritário") => {
    if (!selectedCategory || locationId === null) return;
    setPrinting(true);

    const res = await issueTicketAction({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      priority,
      locationId,
    });

    if (res.success && res.data) {
      setIssuedTicket(res.data as TicketType);
      setRecentIssues((prev) => [res.data as TicketType, ...prev.slice(0, 9)]);
    } else {
      alert(res.error || "Erro ao emitir senha");
    }

    setPrinting(false);
    setSelectedCategory(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toUpperCase().trim();
    if (!query) {
      setSearchResult(null);
      return;
    }

    const queuePos = queue.findIndex((t) => t.ticketNumber === query);
    if (queuePos !== -1) {
      const ticketsAhead = queue.slice(0, queuePos);
      const normalAhead = ticketsAhead.filter((t) => t.priority === "Normal").length;
      const priorityAhead = ticketsAhead.filter((t) => t.priority === "Prioritário").length;

      setSearchResult({
        id: query,
        status: "pending",
        ahead: queuePos,
        normalAhead,
        priorityAhead,
        ticket: queue[queuePos],
      });
      return;
    }

    const historyItem = history.find((t) => t.ticketNumber === query);
    if (historyItem) {
      setSearchResult({
        id: query,
        status: historyItem.status as "calling" | "started" | "completed",
        guiche: historyItem.guiche,
        attendant: historyItem.attendant,
        ticket: historyItem,
      });
      return;
    }

    setSearchResult({ id: query, status: "not_found" });
  };

  const handleTestPrinter = () => {
    setPrinterStatus("testing");
    setShowPrinterTest(true);
    setTimeout(() => {
      setPrinterStatus("success");
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-sefaz-light flex overflow-hidden font-display p-2 md:p-4">
      <div className="flex-1 flex overflow-hidden rounded-[32px] shadow-2xl border border-emerald-100 bg-white relative">
        <TriageSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          searchResult={searchResult}
          setSearchResult={setSearchResult}
          recentIssues={recentIssues}
          setIssuedTicket={setIssuedTicket}
          session={session}
        />
        


        {/* Main Area: Categories */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-sefaz-accent shadow-sm border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
              >
                <Menu size={20} className="md:w-6 md:h-6" />
              </button>
              <NextLink
                href="/"
                className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl items-center justify-center text-sefaz-accent shadow-sm hover:shadow-xl hover:scale-110 transition-all border border-emerald-100/50"
              >
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </NextLink>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-sefaz-dark tracking-tight leading-none">
                  POSTO DE TRIAGEM
                </h1>
                <p className="text-sefaz-accent font-bold text-[8px] md:text-[10px] uppercase tracking-widest opacity-60">
                  Selecione o serviço para emitir a senha
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <LocationSelector
                locations={initialLocations}
                value={locationId ?? 0}
                onChange={(newLocId) => {
                  setLocationId(newLocId);
                  localStorage.setItem("triage_locationId", String(newLocId));
                }}
                heightClass="h-10"
                textSizeClass="text-[10px]"
                className="rounded-xl"
              />
              <button
                onClick={handleTestPrinter}
                className="bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent px-4 h-10 rounded-xl border border-emerald-200 flex items-center gap-2 transition-all active:scale-95 group cursor-pointer"
              >
                <Printer
                  size={18}
                  className="group-hover:rotate-12 transition-transform"
                />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Testar Impressora
                </span>
              </button>

              <div className="text-right relative">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="text-lg font-black text-sefaz-dark leading-none">
                    {new Date().toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] font-bold text-sefaz-accent opacity-50 uppercase tracking-widest">
                    {new Date().toLocaleDateString("pt-BR")}
                  </div>
                </button>
              </div>
            </div>
          </header>

          <CategoryGrid
            categories={categories}
            selectService={selectService}
            printing={printing}
          />
        </main>
      </div>

      <PriorityModal
        selectedCategory={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onIssue={handleIssue}
      />

      <PrinterTestModal
        show={showPrinterTest}
        onClose={() => setShowPrinterTest(false)}
        printerStatus={printerStatus}
      />

      <TicketReceiptModal
        issuedTicket={issuedTicket}
        onClose={() => setIssuedTicket(null)}
      />

      {/* Loading State */}
      {printing && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-[200]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-emerald-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sefaz-medium" />
            <p className="font-black text-sefaz-dark tracking-widest text-xs uppercase animate-pulse">
              Gerando Senha...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
