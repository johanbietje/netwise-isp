import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import OnboardingWizard from "./OnboardingWizard";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface OnboardingContextType {
  startTour: () => void;
  completeTour: () => void;
  isCompleted: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true); // Default to true to prevent auto-show
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Check local storage for onboarding status when the component mounts
  useEffect(() => {
    if (!isLoading && user) {
      const completed = localStorage.getItem("onboardingCompleted");
      setIsCompleted(completed === "true");
      
      // Auto-show onboarding for first-time users on the dashboard
      if (completed !== "true" && location === "/dashboard") {
        setShowOnboarding(true);
      }
    }
  }, [isLoading, user, location]);
  
  const startTour = () => {
    setShowOnboarding(true);
  };
  
  const completeTour = () => {
    setIsCompleted(true);
    localStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
  };
  
  const closeOnboarding = () => {
    setShowOnboarding(false);
  };
  
  return (
    <OnboardingContext.Provider value={{ startTour, completeTour, isCompleted }}>
      {children}
      <OnboardingWizard isOpen={showOnboarding} onClose={closeOnboarding} />
    </OnboardingContext.Provider>
  );
}