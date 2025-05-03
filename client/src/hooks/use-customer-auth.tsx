import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define customer type
export type Customer = {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string | null;
  phone: string | null;
  status: string;
  createdAt: Date | null;
  planId?: number | null;
};

// Create form schemas
export const customerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type CustomerLoginData = z.infer<typeof customerLoginSchema>;

// Define context type
type CustomerAuthContextType = {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Customer, Error, CustomerLoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

// Create context
export const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

// Provider component
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: customer,
    error,
    isLoading,
  } = useQuery<Customer | null, Error>({
    queryKey: ["/api/customer/me"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/customer/me");
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error(`Failed to fetch customer: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: CustomerLoginData) => {
      const res = await apiRequest("POST", "/api/customer/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (customerData: Customer) => {
      queryClient.setQueryData(["/api/customer/me"], customerData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${customerData.fullName || customerData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/customer/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/customer/me"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <CustomerAuthContext.Provider
      value={{
        customer: customer || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

// Hook
export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}