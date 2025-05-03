import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  Settings,
  Users,
  LineChart,
  Network,
  Wifi,
  Layout,
  Headphones
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Define the tour steps
const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to Netwise ISP Management System",
    description: "Let's take a quick tour to help you get started with the system.",
    icon: <Info className="h-8 w-8 text-purple-500" />,
    path: null,
    highlight: null,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Your dashboard provides a complete overview of your ISP operations: monitor customer growth, bandwidth usage, RADIUS status, and recent activity.",
    icon: <Layout className="h-8 w-8 text-purple-500" />,
    path: "/dashboard",
    highlight: ".dashboard-overview",
  },
  {
    id: "customers",
    title: "Customer Management",
    description: "Manage all your customers, their subscriptions, and service details from this section.",
    icon: <Users className="h-8 w-8 text-purple-500" />,
    path: "/customers",
    highlight: ".customer-list",
  },
  {
    id: "network",
    title: "Network Management",
    description: "Monitor and manage your network infrastructure, including topology visualization, IPAM, and network sites.",
    icon: <Network className="h-8 w-8 text-purple-500" />,
    path: "/network",
    highlight: ".network-map",
  },
  {
    id: "radius",
    title: "RADIUS Authentication",
    description: "Configure and monitor your RADIUS server for authentication, authorization, and accounting.",
    icon: <Wifi className="h-8 w-8 text-purple-500" />,
    path: "/radius",
    highlight: ".radius-status",
  },
  {
    id: "pbx",
    title: "PBX System",
    description: "Manage your multi-tenant PBX system, extensions, call flows, and telephony services.",
    icon: <Headphones className="h-8 w-8 text-purple-500" />,
    path: "/pbx",
    highlight: ".pbx-overview",
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    description: "Access detailed reports and analytics about your customers, network usage, and business performance.",
    icon: <LineChart className="h-8 w-8 text-purple-500" />,
    path: "/analytics",
    highlight: ".analytics-charts",
  },
  {
    id: "settings",
    title: "System Settings",
    description: "Configure system settings, user roles, and global preferences for your Netwise installation.",
    icon: <Settings className="h-8 w-8 text-purple-500" />,
    path: "/settings",
    highlight: ".settings-panel",
  },
  {
    id: "finish",
    title: "You're All Set!",
    description: "You've completed the tour of Netwise ISP Management System. You can access this tour anytime from the help menu.",
    icon: <CheckCircle className="h-8 w-8 text-green-500" />,
    path: null,
    highlight: null,
  },
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Calculate progress percentage
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  // Navigate to the appropriate page when step changes
  useEffect(() => {
    const step = tourSteps[currentStep];
    if (step.path) {
      setLocation(step.path);
    }
    
    // Add highlight to the element if specified
    if (step.highlight) {
      const element = document.querySelector(step.highlight);
      if (element) {
        element.classList.add("highlight-element");
        
        // Scroll to the element
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    
    // Cleanup function to remove highlight
    return () => {
      if (tourSteps[currentStep].highlight) {
        const highlightedElements = document.querySelectorAll(".highlight-element");
        highlightedElements.forEach(el => el.classList.remove("highlight-element"));
      }
    };
  }, [currentStep, setLocation]);
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFinish = () => {
    // Save onboarding completion status
    localStorage.setItem("onboardingCompleted", "true");
    
    onClose();
    
    toast({
      title: "Tour Completed!",
      description: "You can access the tour again anytime from the help menu.",
    });
  };
  
  const handleSkip = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleSkip()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full p-2 bg-purple-100">
              {tourSteps[currentStep].icon}
            </div>
            <DialogTitle className="text-xl">{tourSteps[currentStep].title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {tourSteps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <div
          key={currentStep}
          className="py-4"
        >
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-48 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="mx-auto mb-4">
                {tourSteps[currentStep].icon}
              </div>
              <p className="text-sm text-gray-500">
                {currentStep === 0 || currentStep === tourSteps.length - 1 
                  ? "Let's explore the Netwise ISP Management System!" 
                  : `Navigate to the ${tourSteps[currentStep].title} section to see its features`}
              </p>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-1 mb-2" />
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Step {currentStep + 1} of {tourSteps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="text-gray-500"
            >
              Skip Tour
            </Button>
          </div>
          <Button 
            onClick={handleNext} 
            className="bg-purple-700 hover:bg-purple-800 flex items-center gap-1"
          >
            {currentStep === tourSteps.length - 1 ? (
              <>
                Finish
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}