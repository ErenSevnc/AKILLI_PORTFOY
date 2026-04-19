export function normalizeSearchText(value = "") {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(values = []) {
  return normalizeSearchText(values.filter(Boolean).join(" "));
}

export function normalizeSymbolInput(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trimStart()
    .toLocaleUpperCase("tr-TR");
}
