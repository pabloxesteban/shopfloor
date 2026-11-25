# Extraction eval results

Model: `gemini-3.6-flash (from recordings)`. Run at 2026-11-25T20:45:25.488Z. Samples: 12.

Overall field accuracy: **99.7%** (306 of 307 fields).

| Field | Correct | Total | Accuracy |
| --- | ---: | ---: | ---: |
| supplier | 11 | 12 | 91.7% |
| quoteNumber | 12 | 12 | 100.0% |
| date | 12 | 12 | 100.0% |
| currency | 12 | 12 | 100.0% |
| total | 12 | 12 | 100.0% |
| lineCount | 12 | 12 | 100.0% |
| lines.description | 47 | 47 | 100.0% |
| lines.sku | 47 | 47 | 100.0% |
| lines.quantity | 47 | 47 | 100.0% |
| lines.unit | 47 | 47 | 100.0% |
| lines.unitPrice | 47 | 47 | 100.0% |

## Failures

### vidrieria-tres-lomas-long

- `supplier`: expected "Vidriería Tres Lomas", got "Vidrier%C3%A1 Tres Lomas"
