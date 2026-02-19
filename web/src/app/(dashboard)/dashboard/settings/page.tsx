"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { OrganizationMember, MemberRole } from "@/types/organization";
import * as orgsApi from "@/lib/api/organizations";
import { useToast } from "@/lib/context/ToastContext";

const roleColors: Record<MemberRole, "primary" | "secondary" | "success" | "default"> = {
  OWNER: "primary",
  ADMIN: "secondary",
  MEMBER: "success",
  VIEWER: "default",
};

const roleLabels: Record<MemberRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  MEMBER: "Miembro",
  VIEWER: "Lector",
};

export default function SettingsPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoadingMembers(true);
    try {
      const data = await orgsApi.listMembers(currentOrg.id);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (onClose: () => void) => {
    if (!currentOrg || !inviteEmail.trim()) return;
    setError("");
    setIsInviting(true);
    try {
      await orgsApi.inviteMember(currentOrg.id, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      setInviteRole("MEMBER");
      onClose();
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al invitar");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    if (!currentOrg) return;
    try {
      await orgsApi.updateMemberRole(currentOrg.id, memberId, role);
      await loadMembers();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al cambiar rol",
        "error"
      );
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!currentOrg) return;
    if (!confirm(`¿Remover a ${name} de la organización?`)) return;
    try {
      await orgsApi.removeMember(currentOrg.id, memberId);
      await loadMembers();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al remover miembro",
        "error"
      );
    }
  };

  const isAdmin = currentOrg?.role === "OWNER" || currentOrg?.role === "ADMIN";

  if (!currentOrg) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="mt-2 text-default-500">Seleccioná una organización.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader className="flex justify-between items-center px-6">
          <div>
            <h2 className="text-lg font-semibold">Miembros</h2>
            <p className="text-sm text-default-500">{currentOrg.name}</p>
          </div>
          {isAdmin && (
            <Button color="primary" size="sm" onPress={onOpen}>
              Invitar miembro
            </Button>
          )}
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <Table aria-label="Miembros de la organización" removeWrapper>
            <TableHeader>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>Rol</TableColumn>
              {isAdmin ? (
                <TableColumn>Acciones</TableColumn>
              ) : (
                <TableColumn hideHeader>Acciones</TableColumn>
              )}
            </TableHeader>
            <TableBody
              isLoading={isLoadingMembers}
              emptyContent="No hay miembros"
            >
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user.name}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={roleColors[member.role]} variant="flat">
                      {roleLabels[member.role]}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {isAdmin && member.role !== "OWNER" && (
                      <div className="flex gap-2">
                        <Select
                          aria-label="Cambiar rol"
                          size="sm"
                          className="w-32"
                          selectedKeys={[member.role]}
                          onSelectionChange={(keys) => {
                            const newRole = Array.from(keys)[0] as MemberRole;
                            if (newRole && newRole !== member.role) {
                              handleRoleChange(member.id, newRole);
                            }
                          }}
                        >
                          <SelectItem key="ADMIN">Admin</SelectItem>
                          <SelectItem key="MEMBER">Miembro</SelectItem>
                          <SelectItem key="VIEWER">Lector</SelectItem>
                        </Select>
                        <Button
                          color="danger"
                          variant="flat"
                          size="sm"
                          onPress={() => handleRemove(member.id, member.user.name)}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Invitar miembro</ModalHeader>
              <ModalBody>
                {error && (
                  <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                    {error}
                  </div>
                )}
                <Input
                  type="email"
                  label="Email"
                  placeholder="usuario@email.com"
                  value={inviteEmail}
                  onValueChange={setInviteEmail}
                  autoFocus
                />
                <Select
                  label="Rol"
                  selectedKeys={[inviteRole]}
                  onSelectionChange={(keys) => {
                    const role = Array.from(keys)[0] as MemberRole;
                    if (role) setInviteRole(role);
                  }}
                >
                  <SelectItem key="ADMIN">Admin</SelectItem>
                  <SelectItem key="MEMBER">Miembro</SelectItem>
                  <SelectItem key="VIEWER">Lector</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={isInviting}
                  onPress={() => handleInvite(onClose)}
                >
                  Invitar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
