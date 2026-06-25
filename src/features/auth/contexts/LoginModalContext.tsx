"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LoginModalContextType {
  isOpen: boolean;
  pendingPath: string | null;
  openModal: (path?: string) => void;
  closeModal: () => void;
  clearPendingPath: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const openModal = (path?: string) => {
    if (path) setPendingPath(path);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const clearPendingPath = () => {
    setPendingPath(null);
  };

  return (
    <LoginModalContext.Provider
      value={{ isOpen, pendingPath, openModal, closeModal, clearPendingPath }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error("useLoginModal must be used within a LoginModalProvider");
  }
  return context;
}
