import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Pen, Trash2, Ban } from "lucide-react";
import { User, UserRole } from "@/features/users/types";
import { DbTicketWindow, DbCategory } from "@/features/queue/types";
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleBlockUserAction,
} from "@/features/users/actions";
import {
  getTicketWindowsAction,
  getCategoriesAction,
} from "@/features/queue/actions";

interface UsersConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function UsersConfigView({ triggerSuccess }: UsersConfigViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({
    name: "",
    role: UserRole.Atendente,
    guiche: "Guichê 01",
    matricula: "",
    cpf: "",
    email: "",
    username: "",
    password: "",
    services: [] as number[],
  });

  const loadData = React.useCallback(async () => {
    const resUsers = await getUsersAction();
    if (resUsers.success && resUsers.data) setUsers(resUsers.data as User[]);
    
    const resWindows = await getTicketWindowsAction();
    if (resWindows.success && resWindows.data) setTicketWindows(resWindows.data as DbTicketWindow[]);

    const resCategories = await getCategoriesAction();
    if (resCategories.success && resCategories.data) setCategories(resCategories.data as DbCategory[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingUser && editingUserId !== null) {
      const res = await updateUserAction(editingUserId, newUser);
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
      guiche: user.guiche || "Guichê 01",
      matricula: user.matricula,
      cpf: user.cpf,
      email: user.email,
      username: user.username,
      password: "",
      services: user.services || [],
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

      <div className="bg-white rounded-[40px] border border-emerald-50 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-emerald-50/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Nome</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Matrícula / CPF</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Perfil</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Guichê</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-sefaz-accent uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-emerald-50/30">
                <td className="px-6 py-4">
                  <p className="text-xs font-black text-sefaz-dark">{user.name}</p>
                  <p className="text-[10px] text-sefaz-accent font-medium">{user.email}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-sefaz-accent">
                  {user.matricula} <span className="opacity-50">/</span> {user.cpf}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                      user.role === UserRole.Admin
                        ? "bg-red-100 text-red-700"
                        : user.role === UserRole.Gerente
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-sefaz-dark">
                  {user.guiche}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md ${
                      user.blocked
                        ? "bg-red-50 text-red-500 border border-red-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    {user.blocked ? "Bloqueado" : "Ativo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggleBlock(user.id!)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                    title={user.blocked ? "Desbloquear" : "Bloquear"}
                  >
                    <Ban size={16} />
                  </button>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-sefaz-accent hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                    title="Editar"
                  >
                    <Pen size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUserClick(user)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Edit Modal */}
      <Modal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)}
        className="max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
                Editar Servidor
              </h3>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.matricula}
                      onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.cpf}
                      onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Cargo / Perfil
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Guichê
                    </label>
                    <select
                      value={newUser.guiche}
                      onChange={(e) => setNewUser({ ...newUser, guiche: e.target.value })}
                      className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold"
                    >
                      {ticketWindows.map((tw) => (
                        <option key={tw.id} value={tw.name}>
                          {tw.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Serviços Autorizados */}
                <div className="space-y-2 pt-2">
                  <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2 block">
                    Serviços Autorizados
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-2 border border-emerald-50 rounded-2xl bg-emerald-50/30 custom-scrollbar">
                    {categories.map((cat) => {
                      const isAuth = newUser.services.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleUserService(cat.id)}
                          className={`p-2 rounded-xl text-[9px] font-black uppercase text-center border transition-all cursor-pointer ${
                            isAuth
                              ? "bg-sefaz-accent text-white border-sefaz-accent"
                              : "bg-white border-emerald-100 text-sefaz-dark"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all shadow-lg shadow-emerald-900/20 cursor-pointer text-xs uppercase"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
      </Modal>

      {/* Delete User Confirmation */}
      <Modal 
        isOpen={showDeleteConfirm && userToDelete !== null} 
        onClose={() => setShowDeleteConfirm(false)}
        className="max-w-sm w-full p-8 text-center"
      >
        {userToDelete && (
          <>
            <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-2">
                Excluir Servidor
              </h3>
              <p className="text-xs text-sefaz-accent font-medium mb-6">
                Tem certeza de que deseja remover permanentemente o servidor{" "}
                <strong className="text-sefaz-dark">{userToDelete.name}</strong>? Esta ação não
                pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 cursor-pointer text-xs uppercase"
                >
                  Excluir
                </button>
              </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}
