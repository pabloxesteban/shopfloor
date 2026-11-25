import type { Material, MaterialCategory, MaterialUnit } from "@/domain/material";

type CatalogEntry = [sku: string, name: string, category: MaterialCategory, unit: MaterialUnit];

/**
 * The workshop's stock catalog. Names describe generic parts; SKUs are
 * internal codes. Supplier quote samples refer to these SKUs.
 */
export const MATERIAL_CATALOG: readonly CatalogEntry[] = [
  ["PRF-HER-201", "Herrero sliding frame", "profile", "bar-6m"],
  ["PRF-HER-202", "Herrero sliding sash", "profile", "bar-6m"],
  ["PRF-HER-210", "Herrero casement frame", "profile", "bar-6m"],
  ["PRF-HER-215", "Herrero glazing bead", "profile", "bar-6m"],
  ["PRF-MOD-101", "Modena sliding frame", "profile", "bar-6m"],
  ["PRF-MOD-102", "Modena sliding sash", "profile", "bar-6m"],
  ["PRF-MOD-110", "Modena casement frame", "profile", "bar-6m"],
  ["PRF-MOD-111", "Modena casement sash", "profile", "bar-6m"],
  ["PRF-MOD-120", "Modena door leaf", "profile", "bar-6m"],
  ["PRF-A30-301", "A30 thermal break frame", "profile", "bar-6m"],
  ["PRF-A30-302", "A30 tilt and turn sash", "profile", "bar-6m"],
  ["PRF-A30-310", "A30 door frame", "profile", "bar-6m"],
  ["GLS-FLT-4", "Float glass 4 mm", "glass", "m2"],
  ["GLS-FLT-6", "Float glass 6 mm", "glass", "m2"],
  ["GLS-LAM-33", "Laminated glass 3+3", "glass", "m2"],
  ["GLS-LAM-44", "Laminated glass 4+4", "glass", "m2"],
  ["GLS-DVH-4-12-4", "Double glazed unit 4/12/4", "glass", "m2"],
  ["GLS-DVH-LAM", "Double glazed unit with laminated pane", "glass", "m2"],
  ["GLS-FRO-4", "Frosted glass 4 mm", "glass", "m2"],
  ["HDW-RLR-02", "Sliding roller, pair", "hardware", "unit"],
  ["HDW-LCK-SL", "Sliding window lock", "hardware", "unit"],
  ["HDW-LCK-MP", "Multipoint door lock", "hardware", "unit"],
  ["HDW-HDL-CS", "Casement handle", "hardware", "unit"],
  ["HDW-HDL-DR", "Door handle set", "hardware", "unit"],
  ["HDW-HNG-03", "Three-part hinge", "hardware", "unit"],
  ["HDW-TT-KIT", "Tilt and turn hardware kit", "hardware", "unit"],
  ["HDW-SEA-EPDM", "EPDM gasket roll, 50 m", "hardware", "unit"],
  ["HDW-BRU-50", "Brush seal roll, 50 m", "hardware", "unit"],
  ["HDW-SCR-BOX", "Stainless screws, box of 500", "hardware", "unit"],
  ["HDW-SIL-NT", "Neutral silicone cartridge", "hardware", "unit"],
];
