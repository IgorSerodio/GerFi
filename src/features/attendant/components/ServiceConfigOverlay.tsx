import React from "react";

interface ServiceConfigOverlayProps {
  categories: { id: string; name: string }[];
  allowedServices: number[];
}

export default function ServiceConfigOverlay({
  categories,
  allowedServices,
}: ServiceConfigOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-sefaz-light/95 backdrop-blur-md p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-sefaz-dark">
              MEUS SERVIÇOS
            </h2>
            <p className="text-sefaz-accent font-medium uppercase text-xs tracking-widest opacity-60">
              Serviços habilitados para você chamar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl text-left border-2 transition-all ${
                allowedServices.includes(Number(cat.id))
                  ? "border-sefaz-accent bg-emerald-50 shadow-md"
                  : "border-emerald-100 bg-white opacity-40"
              }`}
            >
              <p
                className={`text-xs font-black uppercase tracking-tight ${
                  allowedServices.includes(Number(cat.id))
                    ? "text-sefaz-accent"
                    : "text-sefaz-dark"
                }`}
              >
                {cat.name}
              </p>
              <div
                className={`mt-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  allowedServices.includes(Number(cat.id))
                    ? "bg-sefaz-accent border-sefaz-accent"
                    : "border-emerald-200"
                }`}
              >
                {allowedServices.includes(Number(cat.id)) && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
