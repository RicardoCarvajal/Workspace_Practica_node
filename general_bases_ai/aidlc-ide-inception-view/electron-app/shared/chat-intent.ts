/** Detects if the user is asking the agent to modify documentation (not just Q&A). */
export function looksLikeModificationRequest(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false
  return (
    /\b(unific|fusion|combin|consolida|mezcla|integra)/i.test(t) ||
    /\b(modific|actualiz|edit|reescrib|reestructur|reorganiza|corrige|refactor)/i.test(t) ||
    /\b(cambia|cambiar|agrega|agregar|añade|anade|elimina|borrar|borra|escribe|aplicar|aplica)\b/i.test(
      t
    ) ||
    /\b(crea|crear|genera|generar)\b.+\b(hu|historia|archivo|documento|seccion)/i.test(t) ||
    /\bhaz\b.+\b(cambio|edicion|unific)/i.test(t)
  )
}
