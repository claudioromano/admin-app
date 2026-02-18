"use client";

import { useState } from "react";
import { useOrganization } from "@/lib/context/OrganizationContext";

export function OrgSelector() {
  const {
    organizations,
    currentOrg,
    setCurrentOrg,
    createOrganization,
  } = useOrganization();
  const [showModal, setShowModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const org = organizations.find((o) => o.id === e.target.value);
    if (org) setCurrentOrg(org);
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setError("");
    setIsCreating(true);
    try {
      const org = await createOrganization(newOrgName.trim());
      setCurrentOrg(org);
      setNewOrgName("");
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <select
          value={currentOrg?.id || ""}
          onChange={handleSelectionChange}
          className="w-full rounded-md border border-default-300 bg-default-100 px-2 py-1.5 text-sm"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full rounded-md bg-primary px-2 py-1.5 text-sm text-white hover:bg-primary/90"
        >
          + Nueva organización
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Nueva organización</h2>
            {error && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}
            <input
              type="text"
              placeholder="Nombre de la organización"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-default-300 px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setNewOrgName("");
                }}
                className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateOrg}
                disabled={isCreating}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
