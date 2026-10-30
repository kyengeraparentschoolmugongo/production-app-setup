import { describe, expect, it } from "vitest";
import { interestsSchema, requireAdminRole } from "@/lib/profile-rules";
describe("personal interests and school identity", () => {
  it.each(["hobbies", "best_colour", "favourite_dish", "cartoon", "celebrity", "best_friend", "other_interests"])("allows users to save %s", key => {
    expect(interestsSchema.parse({ [key]: "My favourite" })[key as keyof ReturnType<typeof interestsSchema.parse>]).toBe("My favourite");
  });
  it.each(["name", "photo_url", "class_id", "stream_id", "user_id", "account_type"])("refuses self-service updates to %s", key => {
    expect(() => interestsSchema.parse({ [key]: "changed" })).toThrow();
  });
  it.each(["student", "teacher", undefined])("refuses school-detail administration for %s", role => {
    expect(() => requireAdminRole(role)).toThrow();
  });
  it("allows only administrators to manage school identity", () => { expect(() => requireAdminRole("admin")).not.toThrow(); });
});