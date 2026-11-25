import type { PlainQuote, PlainQuoteLine } from "../src/domain/supplier-quote";

/**
 * Content of the 12 fictional supplier quotes. Each entry is the ground truth
 * (what a perfect extraction returns) plus how the PDF should present it.
 * Suppliers, addresses and phone numbers are invented. Email addresses use
 * the reserved .example domain.
 */

export type Layout = "table" | "list" | "typewriter" | "compact" | "note";
export type NumberStyle = "ar" | "ar-integer" | "us";
export type DateStyle = "dmy" | "words" | "iso";

export interface SampleSpec {
  id: string;
  layout: Layout;
  numbers: NumberStyle;
  dates: DateStyle;
  supplierLines: string[];
  /** How each unit is written on paper. */
  unitWords?: Partial<Record<PlainQuoteLine["unit"], string>>;
  footer: string[];
  truth: PlainQuote;
}

type Line = PlainQuoteLine;
const line = (sku: string | null, description: string, quantity: number, unit: Line["unit"], unitPrice: number): Line => ({
  sku,
  description,
  quantity,
  unit,
  unitPrice,
});

function quote(q: Omit<PlainQuote, "total">): PlainQuote {
  const cents = q.lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPrice * 100), 0);
  return { ...q, total: cents / 100 };
}

export const SAMPLE_SPECS: SampleSpec[] = [
  {
    id: "perfiles-quillen-table",
    layout: "table",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Perfiles Quillén S.R.L.", "Parque Industrial, Lote 14, Ituzaingó", "Tel. 11 0042-1180 · ventas@quillen.example"],
    footer: ["Precios sin IVA. Validez de la oferta: 10 días.", "Entrega en 72 h hábiles."],
    truth: quote({
      supplier: "Perfiles Quillén S.R.L.",
      quoteNumber: "P-00412",
      date: "2026-11-10",
      currency: "ARS",
      lines: [
        line("PRF-MOD-101", "Marco corredizo Modena, barra 6 m", 24, "bar-6m", 48_350),
        line("PRF-MOD-102", "Hoja corrediza Modena, barra 6 m", 24, "bar-6m", 41_900),
        line("PRF-MOD-110", "Marco de abrir Modena, barra 6 m", 12, "bar-6m", 45_120),
        line("PRF-HER-215", "Contravidrio Herrero, barra 6 m", 30, "bar-6m", 12_480.5),
        line("PRF-HER-201", "Marco corredizo Herrero, barra 6 m", 18, "bar-6m", 31_200),
      ],
    }),
  },
  {
    id: "vidrieria-tres-lomas-list",
    layout: "list",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Vidriería Tres Lomas", "Av. de los Talleres 2210, Lanús", "11 0051-7734"],
    unitWords: { m2: "m2" },
    footer: ["Medidas a confirmar en planta. Cortes a medida sin cargo."],
    truth: quote({
      supplier: "Vidriería Tres Lomas",
      quoteNumber: "VT-2026-1187",
      date: "2026-11-12",
      currency: "ARS",
      lines: [
        line("GLS-LAM-33", "Laminado 3+3 incoloro", 18.5, "m2", 58_900),
        line("GLS-FLT-4", "Float 4 mm incoloro", 22, "m2", 21_450),
        line("GLS-DVH-4-12-4", "DVH 4/12/4", 9.75, "m2", 112_300),
        line("GLS-FRO-4", "Esmerilado 4 mm", 4.2, "m2", 29_800),
      ],
    }),
  },
  {
    id: "herrajes-calandria-typewriter",
    layout: "typewriter",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["HERRAJES CALANDRIA S.A.", "Calle 9 N 1450, Quilmes", "11 0067-2290"],
    unitWords: { unit: "u." },
    footer: ["Forma de pago: transferencia a 30 días."],
    truth: quote({
      supplier: "Herrajes Calandria S.A.",
      quoteNumber: "0003-00018822",
      date: "2026-11-04",
      currency: "ARS",
      lines: [
        line("HDW-RLR-02", "Par de rodamientos para corrediza", 120, "unit", 3_850),
        line("HDW-LCK-SL", "Cierre para ventana corrediza", 60, "unit", 4_720),
        line("HDW-HDL-CS", "Manija para ventana de abrir", 40, "unit", 6_390),
        line("HDW-HNG-03", "Bisagra de tres partes", 150, "unit", 2_140),
        line("HDW-SIL-NT", "Silicona neutra, cartucho", 48, "unit", 7_980),
        line("HDW-SCR-BOX", "Tornillos inoxidables, caja x500", 10, "unit", 18_600),
      ],
    }),
  },
  {
    id: "importadora-lapacho-usd",
    layout: "table",
    numbers: "us",
    dates: "iso",
    supplierLines: ["Importadora Lapacho S.A.", "Depósito fiscal, Nave 3, Pilar", "comex@lapacho.example"],
    unitWords: { unit: "unit" },
    footer: ["Prices in US dollars, FOB warehouse. Payment in USD or ARS at the official selling rate."],
    truth: quote({
      supplier: "Importadora Lapacho S.A.",
      quoteNumber: "IL-7731",
      date: "2026-11-09",
      currency: "USD",
      lines: [
        line("HDW-TT-KIT", "Tilt and turn hardware kit, up to 130 kg", 25, "unit", 86.4),
        line("HDW-LCK-MP", "Multipoint lock for aluminum doors", 15, "unit", 142.75),
        line("HDW-HDL-DR", "Door handle set, satin finish", 15, "unit", 38.9),
      ],
    }),
  },
  {
    id: "perfiles-quillen-discount",
    layout: "table",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Perfiles Quillén S.R.L.", "Parque Industrial, Lote 14, Ituzaingó", "Tel. 11 0042-1180 · ventas@quillen.example"],
    footer: ["Descuento por pago anticipado ya aplicado. Precios sin IVA."],
    truth: quote({
      supplier: "Perfiles Quillén S.R.L.",
      quoteNumber: "P-00431",
      date: "2026-11-16",
      currency: "ARS",
      lines: [
        line("PRF-MOD-111", "Hoja de abrir Modena, barra 6 m", 20, "bar-6m", 46_800),
        line("PRF-MOD-120", "Hoja de puerta Modena, barra 6 m", 10, "bar-6m", 62_300),
        line(null, "Descuento comercial 5%", 1, "unit", -77_950),
      ],
    }),
  },
  {
    id: "templados-aguaribay-missing-sku",
    layout: "table",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Templados Aguaribay", "Camino de Cintura 8800, Lomas de Zamora", "11 0039-4410"],
    footer: ["Plazo de entrega: 7 días hábiles."],
    truth: quote({
      supplier: "Templados Aguaribay",
      quoteNumber: "TA-552",
      date: "2026-11-11",
      currency: "ARS",
      lines: [
        line("GLS-LAM-44", "Laminado 4+4 incoloro", 12, "m2", 74_200),
        line(null, "Templado 10 mm para mampara, a medida", 3.6, "m2", 138_000),
        line("GLS-FLT-6", "Float 6 mm incoloro", 15, "m2", 32_700),
      ],
    }),
  },
  {
    id: "distribuidora-nandubay-compact",
    layout: "compact",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Distribuidora Ñandubay", "Ruta provincial 6, km 31, Tigre", "11 0058-6012 · pedidos@nandubay.example"],
    unitWords: { unit: "unid.", "bar-6m": "barra" },
    footer: ["Mercadería sujeta a disponibilidad."],
    truth: quote({
      supplier: "Distribuidora Ñandubay",
      quoteNumber: "N-10294",
      date: "2026-11-13",
      currency: "ARS",
      lines: [
        line("HDW-SEA-EPDM", "Burlete EPDM, rollo 50 m", 8, "unit", 24_900),
        line("HDW-BRU-50", "Felpa, rollo 50 m", 8, "unit", 19_750),
        line("NDB-4471", "Escuadra de armado reforzada", 200, "unit", 1_120),
        line("PRF-HER-210", "Marco de abrir Herrero, barra 6 m", 16, "bar-6m", 29_400),
      ],
    }),
  },
  {
    id: "metalurgica-coihue-no-number",
    layout: "list",
    numbers: "ar",
    dates: "words",
    supplierLines: ["Metalúrgica Coihue", "Pasaje Los Sauces 37, Castelar", "11 0071-3305"],
    unitWords: { "bar-6m": "barras de 6 m" },
    footer: ["Cotización a pedido telefónico del cliente."],
    truth: quote({
      supplier: "Metalúrgica Coihue",
      quoteNumber: null,
      date: "2026-11-18",
      currency: "ARS",
      lines: [
        line("PRF-A30-301", "Marco A30 con ruptura de puente térmico", 14, "bar-6m", 88_600),
        line("PRF-A30-302", "Hoja oscilobatiente A30", 14, "bar-6m", 92_150),
      ],
    }),
  },
  {
    id: "vidrieria-tres-lomas-long",
    layout: "table",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Vidriería Tres Lomas", "Av. de los Talleres 2210, Lanús", "11 0051-7734"],
    unitWords: { m2: "m2", unit: "u." },
    footer: ["Incluye flete dentro de zona sur."],
    truth: quote({
      supplier: "Vidriería Tres Lomas",
      quoteNumber: "VT-2026-1203",
      date: "2026-11-17",
      currency: "ARS",
      lines: [
        line("GLS-LAM-33", "Laminado 3+3 incoloro", 30, "m2", 58_900),
        line("GLS-LAM-44", "Laminado 4+4 incoloro", 10, "m2", 74_200),
        line("GLS-FLT-4", "Float 4 mm incoloro", 40, "m2", 21_450),
        line("GLS-FLT-6", "Float 6 mm incoloro", 12, "m2", 32_700),
        line("GLS-DVH-4-12-4", "DVH 4/12/4", 16.5, "m2", 112_300),
        line("GLS-DVH-LAM", "DVH con laminado 3+3", 8, "m2", 139_900),
        line("GLS-FRO-4", "Esmerilado 4 mm", 6, "m2", 29_800),
        line("HDW-SIL-NT", "Silicona neutra, cartucho", 24, "unit", 7_650),
        line("HDW-SEA-EPDM", "Burlete EPDM, rollo 50 m", 4, "unit", 25_300),
        line("HDW-SCR-BOX", "Tornillos inoxidables, caja x500", 2, "unit", 18_100),
      ],
    }),
  },
  {
    id: "perfiles-quillen-a30",
    layout: "table",
    numbers: "ar-integer",
    dates: "dmy",
    supplierLines: ["Perfiles Quillén S.R.L.", "Parque Industrial, Lote 14, Ituzaingó", "Tel. 11 0042-1180 · ventas@quillen.example"],
    footer: ["Precios sin IVA, redondeados a pesos."],
    truth: quote({
      supplier: "Perfiles Quillén S.R.L.",
      quoteNumber: "P-00436",
      date: "2026-11-17",
      currency: "ARS",
      lines: [
        line("PRF-A30-301", "Marco A30 RPT, barra 6 m", 10, "bar-6m", 87_900),
        line("PRF-A30-302", "Hoja oscilobatiente A30, barra 6 m", 10, "bar-6m", 91_400),
        line("PRF-A30-310", "Marco de puerta A30, barra 6 m", 6, "bar-6m", 104_250),
      ],
    }),
  },
  {
    id: "herrajes-calandria-note",
    layout: "note",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Herrajes Calandria S.A."],
    unitWords: { unit: "unidades" },
    footer: ["Saludos, Ramiro (mostrador)"],
    truth: quote({
      supplier: "Herrajes Calandria S.A.",
      quoteNumber: "R-118",
      date: "2026-11-14",
      currency: "ARS",
      lines: [
        line("HDW-RLR-02", "Rodamientos corrediza (par)", 80, "unit", 3_850),
        line("HDW-LCK-MP", "Cerradura multipunto", 6, "unit", 96_500),
      ],
    }),
  },
  {
    id: "aluminios-calden-units",
    layout: "table",
    numbers: "ar",
    dates: "dmy",
    supplierLines: ["Aluminios Caldén Sur", "Colectora Oeste 4120, Haedo", "11 0046-9921"],
    unitWords: { unit: "unid.", "bar-6m": "barra 6 m" },
    footer: ["Contravidrio cortado a medida, se cotiza por unidad."],
    truth: quote({
      supplier: "Aluminios Caldén Sur",
      quoteNumber: "CS-3381",
      date: "2026-11-15",
      currency: "ARS",
      lines: [
        line("PRF-HER-202", "Hoja corrediza Herrero, barra 6 m", 20, "bar-6m", 27_300),
        line("PRF-HER-215", "Contravidrio Herrero cortado 1,20 m", 60, "unit", 2_480),
      ],
    }),
  },
];
