"use client";

import React, { createContext, useContext, useState } from "react";

// Defines the modal context structure and utility function signatures
interface ModalContextType {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isPremiumOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  openRegister: () => void;
  closeRegister: () => void;
  openPremium: () => void;
  closePremium: () => void;
}

// React Context instance for coordinating modal popup windows
const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * ModalProvider manages state and utility methods for user-facing modal popups
 * (Login, Registration, and Premium upsell modals), ensuring only one is open at a time.
 */
export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);

  // Opens the login dialog while ensuring other modal screens are closed
  const openLogin = () => {
    setIsLoginOpen(true);
    setIsRegisterOpen(false);
    setIsPremiumOpen(false);
  };
  const closeLogin = () => setIsLoginOpen(false);

  // Opens the registration dialog while ensuring other modal screens are closed
  const openRegister = () => {
    setIsRegisterOpen(true);
    setIsLoginOpen(false);
    setIsPremiumOpen(false);
  };
  const closeRegister = () => setIsRegisterOpen(false);

  // Opens the premium checkout dialog while ensuring other modal screens are closed
  const openPremium = () => {
    setIsPremiumOpen(true);
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };
  const closePremium = () => setIsPremiumOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isLoginOpen,
        isRegisterOpen,
        isPremiumOpen,
        openLogin,
        closeLogin,
        openRegister,
        closeRegister,
        openPremium,
        closePremium,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

/**
 * Custom React hook to simplify accessing modal visibility states and control handlers
 */
export const useModals = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModals must be used within a ModalProvider");
  }
  return context;
};

