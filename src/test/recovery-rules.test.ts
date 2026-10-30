import { describe, expect, it } from "vitest";
import { gmailMatches, schoolEmailFor } from "@/lib/recovery-rules";

describe("school emails", () => {
  it("pupil email is name@kpm.com", () => {
    expect(schoolEmailFor("Wasswa Hardy", "student")).toBe("wasswahardy@kpm.com");
  });
  it("teacher email is name.teacher@kpm.com", () => {
    expect(schoolEmailFor("Jane Doe", "teacher")).toBe("janedoe.teacher@kpm.com");
  });
  it("adds a number when the name is already used", () => {
    expect(schoolEmailFor("Brenda", "student", ["brenda@kpm.com"])).toBe("brenda2@kpm.com");
  });
});

describe("password reset Gmail", () => {
  it("rejects a Gmail that is not linked", () => {
    expect(gmailMatches("freshteacheruganda256@gmail.com", "random@gmail.com")).toBe(false);
  });
  it("accepts the linked Gmail", () => {
    expect(gmailMatches("freshteacheruganda256@gmail.com", "FreshTeacherUganda256@gmail.com")).toBe(true);
  });
});
