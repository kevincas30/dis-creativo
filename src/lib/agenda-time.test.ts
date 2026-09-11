import assert from "node:assert/strict";
import test from "node:test";
import { allDayRange, madridDate, madridDateTime, madridTime } from "@/lib/agenda-time";
import { dayKey } from "@/lib/dashboard-agenda-dates";

test("conserva el día y la hora de Madrid al convertir instantes", () => {
  const instant = madridDateTime("2026-09-18", "09:30");
  assert.equal(madridDate(instant), "2026-09-18");
  assert.equal(madridTime(instant), "09:30");
});

test("un evento de todo el día ocupa exactamente el día de Madrid", () => {
  const range = allDayRange("2026-10-25");
  assert.equal(madridDate(range.startAt), "2026-10-25");
  assert.equal(madridDate(new Date(range.endAt.getTime() - 1)), "2026-10-25");
});

test("la Agenda agrupa los elementos por el día de Madrid, aunque el instante sea UTC", () => {
  assert.equal(dayKey(new Date("2026-10-24T22:00:00.000Z")), "2026-10-25");
});
