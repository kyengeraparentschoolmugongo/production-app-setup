import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/lib/coordinator/application-schema";
const base = { student_name: "Wasswa Hardy", class_name: "P5", stream_name: "Orange", position: "english_coordinator" };
describe("independent election details", () => {
  it.each(["P1", "P2", "P3", "P4", "P5", "P6", "P7"])("accepts selected class %s", class_name => { expect(applicationSchema.parse({ ...base, class_name }).class_name).toBe(class_name); });
  it.each(["Orange", "Violet"])("accepts selected stream %s", stream_name => { expect(applicationSchema.parse({ ...base, stream_name }).stream_name).toBe(stream_name); });
  it("accepts a different listed pupil name for the application", () => { expect(applicationSchema.parse({ ...base, student_name: "Buyondo Trinity" }).student_name).toBe("Buyondo Trinity"); });
  it("retains the applicant's uploaded photo", () => { const photo_url = "data:image/jpeg;base64,YWJj"; expect(applicationSchema.parse({ ...base, photo_url }).photo_url).toBe(photo_url); });
  it("rejects unlisted pupil names", () => { expect(() => applicationSchema.parse({ ...base, student_name: "Unlisted" })).toThrow(); });
  it("rejects classes outside P1–P7", () => { expect(() => applicationSchema.parse({ ...base, class_name: "P8" })).toThrow(); });
  it("rejects unlisted streams", () => { expect(() => applicationSchema.parse({ ...base, stream_name: "Blue" })).toThrow(); });
});