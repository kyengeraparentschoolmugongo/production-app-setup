import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/lovable", () => ({ lovable: { auth: { signInWithOAuth: vi.fn() } } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithOAuth: vi.fn() } } }));
import { usesLovableBroker } from "@/lib/google-oauth";

describe("Google sign-in host choice", () => {
  it("uses Lovable's broker on Lovable-hosted sites", () => {
    expect(usesLovableBroker("pupil-pathfinder-studio.lovable.app")).toBe(true);
  });
  it("signs in directly on Vercel", () => {
    expect(usesLovableBroker("kps-mugongo.vercel.app")).toBe(false);
  });
});
