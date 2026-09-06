import assert from "node:assert/strict";
import test from "node:test";
import { prioritizeProjects, projectAttention } from "./workspace-summary";
import type { ProjectStatus } from "@/generated/prisma/enums";

const today = "2026-09-06";
function project(id: string, status: ProjectStatus, dueDate: string | null, updatedAt = "2026-09-01") {
  return { id, status, dueDate: dueDate ? new Date(dueDate) : null, updatedAt: new Date(updatedAt) };
}

test("los proyectos finalizados nunca requieren atención, aunque estén vencidos", () => {
  assert.equal(projectAttention(project("done", "DONE", "2026-09-01"), today), null);
  assert.deepEqual(prioritizeProjects([project("done", "DONE", "2026-09-01")], today), []);
});

test("distingue entregas vencidas, de hoy, futuras y revisión sin fecha", () => {
  assert.equal(projectAttention(project("late", "IN_PROGRESS", "2026-09-05"), today), "Entrega vencida");
  assert.equal(projectAttention(project("today", "NOT_STARTED", "2026-09-06"), today), "Entrega hoy");
  assert.equal(projectAttention(project("future", "IN_PROGRESS", "2026-09-07"), today), null);
  assert.equal(projectAttention(project("review", "REVIEW", null), today), "Pendiente de revisión");
  assert.equal(projectAttention(project("none", "NOT_STARTED", null), today), null);
});

test("prioriza atención y vencimientos sin modificar la lista original", () => {
  const projects = [
    project("future", "IN_PROGRESS", "2026-09-10"),
    project("review", "REVIEW", null),
    project("today", "IN_PROGRESS", "2026-09-06"),
    project("late", "IN_PROGRESS", "2026-09-01"),
    project("done", "DONE", "2026-08-01"),
  ];
  const original = [...projects];
  assert.deepEqual(prioritizeProjects(projects, today).map((p) => p.id), ["late", "today", "review", "future"]);
  assert.deepEqual(projects, original);
});

test("sin fechas usa la actividad más reciente y admite un estado vacío", () => {
  assert.deepEqual(prioritizeProjects([], today), []);
  const projects = [project("older", "IN_PROGRESS", null), project("recent", "IN_PROGRESS", null, "2026-09-05")];
  assert.deepEqual(prioritizeProjects(projects, today).map((p) => p.id), ["recent", "older"]);
});
