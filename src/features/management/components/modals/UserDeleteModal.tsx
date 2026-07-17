import React from "react";
import { Modal } from "@/components/ui/Modal";
import { User } from "@/features/users/types";

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: User | null;
  onConfirm: () => Promise<void>;
}

export function UserDeleteModal({
  isOpen,
  onClose,
  userToDelete,
  onConfirm,
}: UserDeleteModalProps) {
  return (
    <Modal 
      isOpen={isOpen && userToDelete !== null} 
      onClose={onClose}
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
              onClick={onClose}
              className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer text-xs uppercase"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 cursor-pointer text-xs uppercase"
            >
              Excluir
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
