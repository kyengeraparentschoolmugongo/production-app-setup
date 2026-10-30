import { describe, expect, it } from "vitest";
import { photoInput, defaultGooglePhoto, trustedGooglePhoto, PHOTO_MAX_BYTES, PHOTO_MAX_EDGE } from "@/lib/photo-rules";
describe("profile photos", () => {
  it("limits compressed photos to 200KB and 640px", () => { expect(PHOTO_MAX_BYTES).toBe(204800); expect(PHOTO_MAX_EDGE).toBe(640); });
  it("rejects a 10MB original at the server boundary", () => { expect(() => photoInput.parse({ photo: "data:image/jpeg;base64," + "A".repeat(10 * 1024 * 1024) })).toThrow(); });
  it("uses the Google photo when no custom photo exists", () => { expect(defaultGooglePhoto(null, "google-photo")).toBe("google-photo"); });
  it("preserves a chosen custom photo on Google sign-in", () => { expect(defaultGooglePhoto("custom-photo", "google-photo")).toBe("custom-photo"); });
  it("only accepts Google-hosted default photos", () => { expect(trustedGooglePhoto("https://lh3.googleusercontent.com/a/photo")).toBe("https://lh3.googleusercontent.com/a/photo"); expect(trustedGooglePhoto("https://example.com/photo")).toBeNull(); });
  it("refuses ownership or school identity changes during photo upload", () => { expect(() => photoInput.parse({ photo: "data:image/jpeg;base64,YWJj", user_id: "another-user" })).toThrow(); });
});