import { useState, useEffect, useRef, useCallback } from "react";
import { getQueueStateAction, issueTicketAction } from "@/features/queue/actions";
import { Ticket as TicketType } from "@/features/queue/types";
import { Category, SearchResult } from "../components/types";
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";

export function useTriageDashboard() {
  const [issuedTicket, setIssuedTicket] = useState<TicketType | null>(null);
  const [printing, setPrinting] = useState(false);
  const [recentIssues, setRecentIssues] = useState<TicketType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [queue, setQueue] = useState<TicketType[]>([]);
  const [history, setHistory] = useState<TicketType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPrinterTest, setShowPrinterTest] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
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

  const refreshState = useCallback(async () => {
    if (locationId === null) return;
    const res = await getQueueStateAction(locationId);
    if (res.success && res.data) {
      setQueue(res.data.tickets);
      setHistory(res.data.history);
    }
  }, [locationId]);

  const refreshStateRef = useRef(refreshState);
  useEffect(() => {
    refreshStateRef.current = refreshState;
  }, [refreshState]);

  useEffect(() => {
    if (locationId !== null) {
      setTimeout(() => {
        refreshStateRef.current();
      }, 0);
    }
  }, [locationId]);

  useQueueStream(() => refreshStateRef.current());

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

  return {
    state: {
      issuedTicket,
      printing,
      recentIssues,
      selectedCategory,
      queue,
      history,
      searchQuery,
      searchResult,
      showCalendar,
      showPrinterTest,
      printerStatus,
      isSidebarOpen,
      locationId,
    },
    actions: {
      setIssuedTicket,
      setSearchQuery,
      setSearchResult,
      setIsSidebarOpen,
      setLocationId,
      setShowCalendar,
      setShowPrinterTest,
      setPrinterStatus,
      setSelectedCategory,
      selectService,
      handleIssue,
      handleSearch,
      handleTestPrinter,
    },
  };
}
