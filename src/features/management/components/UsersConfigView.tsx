import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Pen, Trash2, Ban } from "lucide-react";
import { User, UserRole } from "@/features/users/types";
import { Location, DbTicketWindow, DbCategory } from "@/features/queue/types";
import {
  getUsersAction,
  updateUserAction,
  deleteUserAction,
  toggleBlockUserAction,
} from "@/features/users/actions";
import { useSession } from "next-auth/react";
import {
  getLocationsAction,
  getTicketWindowsAction,
  getCategoriesAction,
} from "@/features/queue/actions";
import { UsersListTable } from "./UsersListTable";
import { UserFormModal, NewUserFormData } from "./modals/UserFormModal";
import { UserDeleteModal } from "./modals/UserDeleteModal";

interface UsersConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function UsersConfigView({ triggerSuccess }: UsersConfigViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState<NewUserFormData>({
    name: "",
    role: UserRole.Atendente,
    guiche: "",
    matricula: "",
    cpf: "",
    email: "",
    username: "",
    services: [] as number[],
    canCallNormal: true,
    canCallPriority: true,
  });

  const { data: session } = useSession();
  const isGerente = session?.user?.role === UserRole.Gerente;
  const isAdmin = session?.user?.role === UserRole.Admin;

  const loadData = React.useCallback(async () => {
    const resUsers = await getUsersAction();
    if (resUsers.success && resUsers.data) setUsers(resUsers.data as User[]);
    
    const resWindows = await getTicketWindowsAction();
    if (resWindows.success && resWindows.data) setTicketWindows(resWindows.data as DbTicketWindow[]);

    const resCategories = await getCategoriesAction();
    if (resCategories.success && resCategories.data) setCategories(resCategories.data as DbCategory[]);

    const resLocs = await getLocationsAction();
    if (resLocs.success && resLocs.data) setLocations(resLocs.data as Location[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newUser,
      guiche: newUser.guiche === "" ? null : newUser.guiche,
    };

    if (isEditingUser && editingUserId !== null) {
      const res = await updateUserAction(editingUserId, payload);
      if (res.success) {
        triggerSuccess("Servidor atualizado com sucesso!");
        setShowUserModal(false);
        loadData();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    }
  };

  const handleEditUser = (user: User) => {
    setNewUser({
      name: user.name,
      role: user.role,
      guiche: user.guiche || "",
      matricula: user.matricula,
      cpf: user.cpf,
      email: user.email,
      username: user.username,
      services: user.services || [],
      canCallNormal: user.canCallNormal ?? true,
      canCallPriority: user.canCallPriority ?? true,
    });
    setEditingUserId(user.id || null);
    setIsEditingUser(true);
    setShowUserModal(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete && userToDelete.id !== undefined) {
      const res = await deleteUserAction(userToDelete.id);
      if (res.success) {
        triggerSuccess("Servidor excluído!");
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        loadData();
      } else {
        alert("Erro ao excluir");
      }
    }
  };

  const handleToggleBlock = async (id: number) => {
    const res = await toggleBlockUserAction(id);
    if (res.success) {
      triggerSuccess("Status de bloqueio alterado!");
      loadData();
    }
  };

  const toggleUserService = (id: number) => {
    setNewUser((prev) => {
      const services = prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id];
      return { ...prev, services };
    });
  };

  const visibleUsers = users.filter((u) => {
    if (isGerente && u.role === UserRole.Admin) return false;
    return true;
  });

  return (
    <motion.div
      key="config_users"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
          Servidores Cadastrados
        </h3>
      </div>

      <UsersListTable 
        users={users}
        isGerente={isGerente}
        isAdmin={isAdmin}
        onEdit={handleEditUser}
        onDelete={handleDeleteUserClick}
        onToggleBlock={handleToggleBlock}
      />
      {/* User Edit Modal */}
      <UserFormModal 
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        onSubmit={handleUserSubmit}
        isGerente={isGerente}
        ticketWindows={ticketWindows}
        locations={locations}
        categories={categories}
        toggleUserService={toggleUserService}
      />
      {/* Delete User Confirmation */}
      <UserDeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        userToDelete={userToDelete}
        onConfirm={confirmDeleteUser}
      />
    </motion.div>
  );
}
