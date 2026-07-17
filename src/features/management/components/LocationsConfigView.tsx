import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Pen, Trash2, MapPin, Ban, CheckCircle } from "lucide-react";
import { Location, DbTicketWindow } from "@/features/queue/types";
import {
  getLocationsAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  getTicketWindowsAction,
  createNextTicketWindowAction,
  deleteTicketWindowAction,
} from "@/features/queue/actions";

import { LocationsList } from "./LocationsList";
import { TicketWindowsList } from "./TicketWindowsList";
import { LocationFormModal } from "./modals/LocationFormModal";

interface LocationsConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function LocationsConfigView({ triggerSuccess }: LocationsConfigViewProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [ticketWindows, setTicketWindows] = useState<DbTicketWindow[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [newLocationName, setNewLocationName] = useState("");

  const loadLocations = React.useCallback(async () => {
    const res = await getLocationsAction();
    if (res.success && res.data) {
      const locs = res.data as Location[];
      setLocations(locs);
      if (selectedLocationId === null && locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      }
    }
  }, [selectedLocationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLocations();
  }, [loadLocations]);

  const loadWindows = React.useCallback(async () => {
    if (selectedLocationId !== null) {
      const res = await getTicketWindowsAction(selectedLocationId);
      if (res.success && res.data) {
        setTicketWindows(res.data as DbTicketWindow[]);
      }
    }
  }, [selectedLocationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWindows();
  }, [loadWindows]);

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingLocation && editingLocationId !== null) {
      // Preserve the current isActive state when editing the name
      const currLoc = locations.find(l => l.id === editingLocationId);
      const res = await updateLocationAction(editingLocationId, newLocationName, currLoc?.isActive ?? true);
      if (res.success) {
        triggerSuccess("Local atualizado!");
        setShowLocationModal(false);
        loadLocations();
      } else {
        alert(res.error || "Erro ao atualizar");
      }
    } else {
      const res = await createLocationAction(newLocationName);
      if (res.success) {
        triggerSuccess("Local criado!");
        setShowLocationModal(false);
        loadLocations();
      } else {
        alert(res.error || "Erro ao criar");
      }
    }
  };

  const handleToggleActive = async (loc: Location) => {
    const res = await updateLocationAction(loc.id, loc.name, !loc.isActive);
    if (res.success) {
      triggerSuccess(loc.isActive ? "Local bloqueado!" : "Local ativado!");
      loadLocations();
    } else {
      alert(res.error || "Erro ao alterar status");
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este local?")) {
      const res = await deleteLocationAction(id);
      if (res.success) {
        triggerSuccess("Local excluído!");
        if (selectedLocationId === id) setSelectedLocationId(null);
        loadLocations();
      } else {
        alert(res.error || "Erro ao excluir local");
      }
    }
  };

  const handleCreateTicketWindow = async () => {
    if (selectedLocationId === null) return;
    const res = await createNextTicketWindowAction(selectedLocationId);
    if (res.success) {
      triggerSuccess("Guichê criado com sucesso!");
      loadWindows();
    } else {
      alert(res.error || "Erro ao criar guichê");
    }
  };

  const handleDeleteTicketWindow = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este guichê?")) {
      const res = await deleteTicketWindowAction(id);
      if (res.success) {
        triggerSuccess("Guichê excluído!");
        loadWindows();
      } else {
        alert(res.error || "Erro ao excluir guichê");
      }
    }
  };

  return (
    <motion.div
      key="config_locations"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LOCAIS */}
        <LocationsList
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={setSelectedLocationId}
          onToggleActive={handleToggleActive}
          onEditLocation={(loc) => {
            setNewLocationName(loc.name);
            setEditingLocationId(loc.id);
            setIsEditingLocation(true);
            setShowLocationModal(true);
          }}
          onDeleteLocation={handleDeleteLocation}
          onNewLocation={() => {
            setNewLocationName("");
            setIsEditingLocation(false);
            setShowLocationModal(true);
          }}
        />

        {/* GUICHÊS */}
        <TicketWindowsList
          ticketWindows={ticketWindows}
          selectedLocationId={selectedLocationId}
          onCreateTicketWindow={handleCreateTicketWindow}
          onDeleteTicketWindow={handleDeleteTicketWindow}
        />

      </div>

      {/* MODAL DE LOCAL */}
      <LocationFormModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        isEditing={isEditingLocation}
        locationName={newLocationName}
        onLocationNameChange={setNewLocationName}
        onSubmit={handleLocationSubmit}
      />
    </motion.div>
  );
}
