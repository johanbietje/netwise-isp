import { useState } from "react";
import { HelpCircle, BookOpen, Play, Lightbulb, MessageSquare, Coffee } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function HelpButton() {
  const { startTour } = useOnboarding();
  const { toast } = useToast();
  
  const handleStartTour = () => {
    startTour();
  };
  
  const handleShowDocs = () => {
    toast({
      title: "Documentation",
      description: "Documentation would open in a new tab.",
    });
  };
  
  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Support contact form would open here.",
    });
  };
  
  const handleShowTips = () => {
    toast({
      title: "Tips & Tricks",
      description: "Tips & tricks would be shown here.",
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
          <HelpCircle className="h-5 w-5 text-purple-700" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleStartTour} className="cursor-pointer gap-2">
          <Play className="h-4 w-4" />
          <span>Start System Tour</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShowDocs} className="cursor-pointer gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Documentation</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShowTips} className="cursor-pointer gap-2">
          <Lightbulb className="h-4 w-4" />
          <span>Tips & Tricks</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleContactSupport} className="cursor-pointer gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Contact Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer gap-2"
          onClick={() => window.open("https://www.buymeacoffee.com", "_blank")}
        >
          <Coffee className="h-4 w-4" />
          <span>Buy Us a Coffee</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}