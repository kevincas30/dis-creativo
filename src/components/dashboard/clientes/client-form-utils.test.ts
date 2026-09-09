import test from "node:test";
import assert from "node:assert/strict";
import { clientCreatedMessage, clientFormFeedback } from "@/components/dashboard/clientes/client-form-utils";

test("traduce errores de validación a un campo visible sin perder el mensaje", () => {
  assert.deepEqual(clientFormFeedback(new Error("El nombre es obligatorio."), "Error"), { message: "El nombre es obligatorio.", field: "name" });
  assert.deepEqual(clientFormFeedback(new Error("Selecciona la fecha del seguimiento."), "Error"), { message: "Selecciona la fecha del seguimiento.", field: "followUpDate" });
  assert.deepEqual(clientFormFeedback(new Error("Error inesperado."), "Error"), { message: "Error inesperado." });
});

test("usa una confirmación específica para cada etapa comercial", () => {
  assert.equal(clientCreatedMessage("PROSPECT"), "Prospecto creado");
  assert.equal(clientCreatedMessage("CLIENT"), "Cliente creado");
});
