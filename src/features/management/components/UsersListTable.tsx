import React from "react";
import { Pen, Trash2, Ban } from "lucide-react";
import { User, UserRole } from "@/features/users/types";

interface UsersListTableProps {
  users: User[];
  isGerente: boolean;
  isAdmin: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleBlock: (id: number) => void;
}

export function UsersListTable({
  users,
  isGerente,
  isAdmin,
  onEdit,
  onDelete,
  onToggleBlock,
}: UsersListTableProps) {
  const visibleUsers = users.filter((u) => {
    if (isGerente && u.role === UserRole.Admin) return false;
    return true;
  });

  return (
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
          {visibleUsers.map((user) => {
            const canEdit = isAdmin || (isGerente && user.role !== UserRole.Gerente && user.role !== UserRole.Admin);
            const canDelete = isAdmin;

            return (
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
                  {canEdit && (
                    <>
                      <button
                        onClick={() => onToggleBlock(user.id!)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                        title={user.blocked ? "Desbloquear" : "Bloquear"}
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-sefaz-accent hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                        title="Editar"
                      >
                        <Pen size={16} />
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
