/**
 * Generates the bundled supplier quote PDFs and their ground truth.
 *
 *   pnpm samples
 *
 * Writes public/samples/<id>.pdf and fixtures/truth/<id>.json. Output is
 * deterministic (fixed metadata dates), so regenerating without changes to
 * sample-quotes.ts produces identical files.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { PlainQuoteSchema, type PlainQuote, type PlainQuoteLine } from "../src/domain/supplier-quote";
import { SAMPLE_QUOTES } from "../src/server/ai/samples";
import { SAMPLE_SPECS, type DateStyle, type NumberStyle, type SampleSpec } from "./sample-quotes";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXED_DATE = new Date("2026-11-01T12:00:00.000Z");
const PAGE: [number, number] = [595.28, 841.89]; // A4 in points
const MARGIN = 50;
const INK = rgb(0.12, 0.12, 0.14);
const SOFT = rgb(0.42, 0.44, 0.48);
const RULE = rgb(0.78, 0.8, 0.83);

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatNumber(value: number, style: NumberStyle, decimals = 2): string {
  if (style === "us") {
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  const d = style === "ar-integer" ? 0 : decimals;
  return value.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function formatQuantity(value: number, style: NumberStyle): string {
  const decimals = Number.isInteger(value) ? 0 : 2;
  const text = style === "us" ? value.toLocaleString("en-US", { maximumFractionDigits: decimals }) : value.toLocaleString("es-AR", { maximumFractionDigits: decimals });
  return text;
}

function formatMoney(value: number, quote: PlainQuote, style: NumberStyle): string {
  const prefix = quote.currency === "USD" ? "USD " : "$ ";
  return `${value < 0 ? "-" : ""}${prefix}${formatNumber(Math.abs(value), style)}`;
}

function formatDate(iso: string, style: DateStyle): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  if (style === "iso") return iso;
  if (style === "words") return `${d} de ${MONTHS[m - 1]} de ${y}`;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

const DEFAULT_UNIT_WORDS: Record<PlainQuoteLine["unit"], string> = { "bar-6m": "barra 6 m", m2: "m2", unit: "unid." };

function unitWord(spec: SampleSpec, unit: PlainQuoteLine["unit"]): string {
  return spec.unitWords?.[unit] ?? DEFAULT_UNIT_WORDS[unit];
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
  italic: PDFFont;
}

class Writer {
  y: number;
  constructor(
    readonly page: PDFPage,
    readonly fonts: Fonts,
  ) {
    this.y = PAGE[1] - MARGIN;
  }
  text(value: string, x: number, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right"; width?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.fonts.regular;
    const drawX = opts.align === "right" && opts.width !== undefined ? x + opts.width - font.widthOfTextAtSize(value, size) : x;
    this.page.drawText(value, { x: drawX, y: this.y, size, font, color: opts.color ?? INK });
  }
  rule(x1 = MARGIN, x2 = PAGE[0] - MARGIN) {
    this.page.drawLine({ start: { x: x1, y: this.y }, end: { x: x2, y: this.y }, thickness: 0.6, color: RULE });
  }
  down(points: number) {
    this.y -= points;
  }
}

function header(w: Writer, spec: SampleSpec, title: string) {
  const q = spec.truth;
  spec.supplierLines.forEach((text, i) => {
    w.text(text, MARGIN, { size: i === 0 ? 15 : 9, font: i === 0 ? w.fonts.bold : w.fonts.regular, color: i === 0 ? INK : SOFT });
    w.down(i === 0 ? 18 : 12);
  });
  const right = PAGE[0] - MARGIN - 180;
  const top = PAGE[1] - MARGIN;
  const saved = w.y;
  w.y = top;
  w.text(title, right, { size: 13, font: w.fonts.bold, align: "right", width: 180 });
  w.down(16);
  if (q.quoteNumber) {
    w.text(`N° ${q.quoteNumber}`, right, { size: 10, align: "right", width: 180 });
    w.down(13);
  }
  if (q.date) w.text(`Fecha: ${formatDate(q.date, spec.dates)}`, right, { size: 10, align: "right", width: 180 });
  w.y = Math.min(saved, w.y) - 18;
  w.text("Cliente: Frame & Pane Co. (taller de aberturas)", MARGIN, { size: 10 });
  w.down(22);
}

function footer(w: Writer, spec: SampleSpec, font?: PDFFont) {
  w.down(28);
  for (const text of spec.footer) {
    w.text(text, MARGIN, { size: 9, color: SOFT, font });
    w.down(13);
  }
}

function renderTable(w: Writer, spec: SampleSpec, compact: boolean) {
  const q = spec.truth;
  const size = compact ? 8 : 9;
  const cols = compact
    ? [
        { key: "code", label: "Cód.", width: 70 },
        { key: "desc", label: "Artículo", width: 215 },
        { key: "qty", label: "Cantidad", width: 70, right: true },
        { key: "price", label: "Precio", width: 70, right: true },
        { key: "amount", label: "Subtotal", width: 70, right: true },
      ]
    : [
        { key: "code", label: "Código", width: 80 },
        { key: "desc", label: "Descripción", width: 165 },
        { key: "qty", label: "Cant.", width: 40, right: true },
        { key: "unit", label: "Unidad", width: 55 },
        { key: "price", label: "P. unitario", width: 75, right: true },
        { key: "amount", label: "Importe", width: 80, right: true },
      ];
  const xs: number[] = [];
  cols.reduce((x, col) => {
    xs.push(x);
    return x + col.width;
  }, MARGIN);

  w.rule();
  w.down(13);
  cols.forEach((col, i) => w.text(col.label, xs[i]!, { size, font: w.fonts.bold, align: col.right ? "right" : "left", width: col.width - 6 }));
  w.down(7);
  w.rule();
  w.down(13);

  for (const l of q.lines) {
    const descLines = wrap(l.description, w.fonts.regular, size, cols.find((c) => c.key === "desc")!.width - 8);
    const values: Record<string, string> = {
      code: l.sku ?? "",
      desc: descLines[0] ?? "",
      qty: compact ? `${formatQuantity(l.quantity, spec.numbers)} ${unitWord(spec, l.unit)}` : formatQuantity(l.quantity, spec.numbers),
      unit: unitWord(spec, l.unit),
      price: formatNumber(l.unitPrice, spec.numbers),
      amount: formatNumber(Math.round(l.quantity * l.unitPrice * 100) / 100, spec.numbers),
    };
    cols.forEach((col, i) => w.text(values[col.key] ?? "", xs[i]!, { size, align: col.right ? "right" : "left", width: col.width - 6 }));
    for (const extra of descLines.slice(1)) {
      w.down(size + 3);
      w.text(extra, xs[1]!, { size });
    }
    w.down(size + 8);
  }
  w.rule();
  w.down(18);
  const totalLabel = q.currency === "USD" ? "TOTAL USD" : "TOTAL";
  w.text(totalLabel, PAGE[0] - MARGIN - 260, { size: 11, font: w.fonts.bold });
  w.text(formatMoney(q.total, q, spec.numbers), PAGE[0] - MARGIN - 160, { size: 11, font: w.fonts.bold, align: "right", width: 160 });
}

function renderList(w: Writer, spec: SampleSpec) {
  const q = spec.truth;
  w.text("Detalle:", MARGIN, { size: 11, font: w.fonts.bold });
  w.down(18);
  for (const l of q.lines) {
    const code = l.sku ? ` (${l.sku})` : "";
    const text = `• ${formatQuantity(l.quantity, spec.numbers)} ${unitWord(spec, l.unit)} de ${l.description}${code}, a ${formatMoney(l.unitPrice, q, spec.numbers)} c/u`;
    for (const part of wrap(text, w.fonts.regular, 10, PAGE[0] - 2 * MARGIN - 10)) {
      w.text(part, MARGIN + 6, { size: 10 });
      w.down(14);
    }
    w.down(4);
  }
  w.down(10);
  w.text(`Total: ${formatMoney(q.total, q, spec.numbers)}`, MARGIN, { size: 12, font: w.fonts.bold });
}

function renderTypewriter(w: Writer, spec: SampleSpec) {
  const q = spec.truth;
  const mono = w.fonts.mono;
  const pad = (text: string, n: number, right = false) => (right ? text.padStart(n) : text.padEnd(n)).slice(0, n);
  const row = (cells: string[]) => w.text(cells.join(" "), MARGIN, { size: 8.5, font: mono });
  for (const text of spec.supplierLines) {
    w.text(text, MARGIN, { size: 10, font: w.fonts.monoBold });
    w.down(13);
  }
  w.down(8);
  w.text(`PRESUPUESTO ${q.quoteNumber ?? ""}`, MARGIN, { size: 10, font: w.fonts.monoBold });
  w.down(13);
  if (q.date) w.text(`FECHA ${formatDate(q.date, spec.dates)}`, MARGIN, { size: 10, font: mono });
  w.down(13);
  w.text("SR. CLIENTE: FRAME & PANE CO.", MARGIN, { size: 10, font: mono });
  w.down(20);
  const sep = "-".repeat(92);
  w.text(sep, MARGIN, { size: 8.5, font: mono });
  w.down(12);
  row([pad("CODIGO", 13), pad("DESCRIPCION", 36), pad("CANT", 6, true), pad("UN", 3), pad("P.UNIT", 13, true), pad("IMPORTE", 16, true)]);
  w.down(12);
  w.text(sep, MARGIN, { size: 8.5, font: mono });
  w.down(12);
  for (const l of q.lines) {
    row([
      pad(l.sku ?? "", 13),
      pad(l.description.toUpperCase(), 36),
      pad(formatQuantity(l.quantity, spec.numbers), 6, true),
      pad(unitWord(spec, l.unit), 3),
      pad(formatNumber(l.unitPrice, spec.numbers), 13, true),
      pad(formatNumber(Math.round(l.quantity * l.unitPrice * 100) / 100, spec.numbers), 16, true),
    ]);
    w.down(12);
  }
  w.text(sep, MARGIN, { size: 8.5, font: mono });
  w.down(14);
  w.text(`${"TOTAL $".padStart(74)}${formatNumber(q.total, spec.numbers).padStart(16)}`, MARGIN, { size: 8.5, font: w.fonts.monoBold });
  footer(w, spec, mono);
}

function renderNote(w: Writer, spec: SampleSpec) {
  const q = spec.truth;
  const font = w.fonts.italic;
  const say = (text: string, size = 13) => {
    for (const part of wrap(text, font, size, PAGE[0] - 2 * MARGIN)) {
      w.text(part, MARGIN, { size, font });
      w.down(size + 6);
    }
  };
  say(spec.supplierLines[0] ?? "", 15);
  w.down(10);
  say("Hola, te paso lo que me pediste por teléfono:");
  w.down(4);
  for (const l of q.lines) {
    say(`- ${formatQuantity(l.quantity, spec.numbers)} ${unitWord(spec, l.unit)} ${l.sku ?? ""} ${l.description.toLowerCase()} a ${formatMoney(l.unitPrice, q, spec.numbers)} cada una`);
  }
  w.down(6);
  say(`Total ${formatMoney(q.total, q, spec.numbers)}`);
  say(`Presupuesto ${q.quoteNumber ?? ""} del ${q.date ? formatDate(q.date, spec.dates) : ""}`);
  w.down(10);
  for (const text of spec.footer) say(text, 12);
}

async function renderPdf(spec: SampleSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Presupuesto ${spec.truth.quoteNumber ?? spec.id}`);
  doc.setAuthor(spec.truth.supplier);
  doc.setSubject("Fictional supplier quote for the Shopfloor concept project");
  doc.setProducer("Shopfloor sample generator");
  doc.setCreator("Shopfloor sample generator");
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
    monoBold: await doc.embedFont(StandardFonts.CourierBold),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
  const w = new Writer(doc.addPage(PAGE), fonts);

  switch (spec.layout) {
    case "table":
    case "compact":
      header(w, spec, "PRESUPUESTO");
      renderTable(w, spec, spec.layout === "compact");
      footer(w, spec);
      break;
    case "list":
      header(w, spec, "COTIZACIÓN");
      renderList(w, spec);
      footer(w, spec);
      break;
    case "typewriter":
      renderTypewriter(w, spec);
      break;
    case "note":
      renderNote(w, spec);
      break;
  }
  return doc.save({ useObjectStreams: false });
}

async function main() {
  const ids = new Set(SAMPLE_QUOTES.map((s) => s.id));
  if (ids.size !== SAMPLE_SPECS.length || SAMPLE_SPECS.some((s) => !ids.has(s.id))) {
    throw new Error("scripts/sample-quotes.ts and src/server/ai/samples.ts list different samples");
  }
  await mkdir(path.join(ROOT, "public/samples"), { recursive: true });
  await mkdir(path.join(ROOT, "fixtures/truth"), { recursive: true });

  for (const spec of SAMPLE_SPECS) {
    const truth = PlainQuoteSchema.parse(spec.truth);
    await writeFile(path.join(ROOT, "public/samples", `${spec.id}.pdf`), await renderPdf(spec));
    await writeFile(path.join(ROOT, "fixtures/truth", `${spec.id}.json`), `${JSON.stringify(truth, null, 2)}\n`);
    console.log(`wrote ${spec.id}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
