"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Organization } from "@/types/organization";
import * as orgsApi from "@/lib/api/organizations";
import { useAuth } from "./AuthContext";

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

const ORG_STORAGE_KEY = "adminapp_current_org_id";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrganizations = useCallback(async () => {
    try {
      const orgs = await orgsApi.listOrganizations();
      setOrganizations(orgs);

      // Restore saved org or default to first
      const savedOrgId =
        typeof window !== "undefined"
          ? localStorage.getItem(ORG_STORAGE_KEY)
          : null;
      const savedOrg = savedOrgId ? orgs.find((o) => o.id === savedOrgId) : null;
      const activeOrg = savedOrg || orgs[0] || null;
      setCurrentOrgState(activeOrg);
    } catch {
      setOrganizations([]);
      setCurrentOrgState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrgState(null);
      setIsLoading(false);
    }
  }, [user, refreshOrganizations]);

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    if (typeof window !== "undefined") {
      localStorage.setItem(ORG_STORAGE_KEY, org.id);
    }
  }, []);

  const createOrganization = useCallback(
    async (name: string) => {
      const org = await orgsApi.createOrganization(name);
      await refreshOrganizations();
      return org;
    },
    [refreshOrganizations],
  );

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        isLoading,
        setCurrentOrg,
        refreshOrganizations,
        createOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}
