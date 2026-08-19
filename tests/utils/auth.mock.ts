import { vi } from "vitest";

type Role = "Admin" | "Atendente" | "Recepcao" | "Triagem";

const mockSessionState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: "Admin User",
    email: "admin@gerfi.com",
    role: "Admin",
    canCallNormal: true,
    canCallPriority: true,
  }
}));

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockImplementation(() => Promise.resolve({ user: mockSessionState.user })),
}));

export const mockUserSession = (role: Role = "Admin", overrides: any = {}) => {
  mockSessionState.user = {
    id: 1,
    name: `${role} User`,
    email: `${role.toLowerCase()}@gerfi.com`,
    role: role,
    canCallNormal: true,
    canCallPriority: role === "Admin" || role === "Atendente",
    ...overrides
  };
};
