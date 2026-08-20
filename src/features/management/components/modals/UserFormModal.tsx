import React from "react";
import { Modal } from "@/components/ui/Modal";
import { UserRole } from "@/features/users/types";
import { DbCategory, DbTicketWindow, Location } from "@/features/management/types";
import { formatCpf, removeNonDigits } from "@/lib/formatters";

export interface NewUserFormData {
  name: string;
  role: UserRole;
  ticketWindowId: number | null;
  guicheName: string;
  matricula: string;
  cpf: string;
  email: string;
  username: string;
  services: number[];
  canCallNormal: boolean;
  canCallPriority: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  newUser: NewUserFormData;
  setNewUser: (user: NewUserFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  canManageSensitive: boolean;
  isSelfEdit: boolean;
  ticketWindows: DbTicketWindow[];
  locations: Location[];
  categories: DbCategory[];
  toggleUserService: (id: number) => void;
}

export function UserFormModal({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  onSubmit,
  canManageSensitive,
  isSelfEdit,
  ticketWindows,
  locations,
  categories,
  toggleUserService,
}: UserFormModalProps) {
  const disableSensitive = !canManageSensitive && isSelfEdit;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
        Editar Servidor
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Nome
            </label>
            <input
              type="text"
              required
              disabled={disableSensitive}
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Email
            </label>
            <input
              type="email"
              required
              disabled={disableSensitive}
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
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
              disabled={disableSensitive}
              value={newUser.matricula}
              onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              CPF
            </label>
            <input
              type="text"
              required
              disabled={disableSensitive}
              value={formatCpf(newUser.cpf)}
              onChange={(e) => setNewUser({ ...newUser, cpf: removeNonDigits(e.target.value) })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
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
              disabled={disableSensitive}
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Cargo / Perfil
            </label>
            <select
              disabled={disableSensitive}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {Object.values(UserRole).filter(r => {
                if (!canManageSensitive && (r === UserRole.Admin || r === UserRole.Gerente) && r !== newUser.role) return false;
                return true;
              }).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Guichê
            </label>
            <select
              disabled={disableSensitive}
              value={newUser.ticketWindowId || ""}
              onChange={(e) => {
                const twId = e.target.value ? Number(e.target.value) : null;
                const tw = ticketWindows.find(t => t.id === twId);
                setNewUser({ ...newUser, ticketWindowId: twId, guicheName: tw ? tw.name : "" });
              }}
              className={`w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-xs font-bold ${disableSensitive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Sem guichê</option>
              {ticketWindows
                .slice()
                .sort((a, b) => {
                  const locA = locations.find((l) => l.id === a.locationId)?.name || "";
                  const locB = locations.find((l) => l.id === b.locationId)?.name || "";
                  if (locA !== locB) return locA.localeCompare(locB);
                  return a.name.localeCompare(b.name);
                })
                .map((tw) => {
                  const loc = locations.find((l) => l.id === tw.locationId);
                  const baseLabel = loc ? `${loc.name} - ${tw.name}` : tw.name;
                  let displayLabel = baseLabel;
                  if (tw.alias) {
                    displayLabel += ` (${tw.alias})`;
                  }
                  return (
                    <option key={tw.id} value={tw.id}>
                      {displayLabel}
                    </option>
                  );
                })}
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

        {/* Permissões de Chamada */}
        <div className="space-y-2 pt-2">
          <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2 block">
            Permissões de Chamada
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-sefaz-dark cursor-pointer select-none bg-emerald-50/30 p-2 rounded-lg border border-emerald-50 flex-1">
              <input
                type="checkbox"
                checked={newUser.canCallNormal}
                onChange={(e) => setNewUser({ ...newUser, canCallNormal: e.target.checked })}
                className="accent-sefaz-accent w-4 h-4 cursor-pointer"
              />
              Pode Atender Normal
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-sefaz-dark cursor-pointer select-none bg-emerald-50/30 p-2 rounded-lg border border-emerald-50 flex-1">
              <input
                type="checkbox"
                checked={newUser.canCallPriority}
                onChange={(e) => setNewUser({ ...newUser, canCallPriority: e.target.checked })}
                className="accent-sefaz-accent w-4 h-4 cursor-pointer"
              />
              Pode Atender Prioridade
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
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
  );
}
