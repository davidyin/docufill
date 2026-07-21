/**
 * DocuFill — AI Prompt Templates
 *
 * Each prompt is designed for structured extraction from documents.
 * We ask for clean JSON output matching our field schemas.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are DocuFill's document analysis engine. You extract structured data from document images (receipts, invoices, tax forms) with high precision.

RULES:
1. Output ONLY valid JSON, no additional text or markdown
2. For date fields, use ISO format: YYYY-MM-DD
3. For monetary values, return numbers only (no currency symbols)
4. If a field is not visible or not applicable, set it to null
5. For line items, return an array of objects
6. Include a "document_type" field at top level indicating what you detected
7. Include a "confidence" field (0-1) for each value, or an overall confidence score

OUTPUT FORMAT:
{
  "document_type": "receipt|invoice|t4|t5|t3|generic",
  "confidence": 0.0-1.0,
  "fields": {
    "field_name": {"value": "...", "confidence": 0.95},
    ...
  }
}`;

export const RECEIPT_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this receipt/invoice and extract:
- vendor_name (string): Store/business name
- date (string YYYY-MM-DD): Transaction date
- total_amount (number): Final total
- tax_amount (number): Tax amount (HST/GST/PST)
- currency (string): Currency code (default CAD)
- payment_method (string): cash, credit, debit, etc.
- line_items (array of {description, quantity, unit_price, total}): Individual items
- category (string): Food, Transport, Office, Medical, etc.`;

export const T4_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this Canadian T4 slip and extract ALL boxes, especially:
- employer_name: Employer's legal name
- tax_year: Year on the form
- box_14: Employment income
- box_16: Employee's CPP contributions
- box_18: Employee's EI premiums
- box_22: Income tax deducted
- box_44: Union dues
- box_52: Pension adjustment
- box_85: Employee premiums (if present)`;

export const T5_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this Canadian T5 slip and extract:
- issuer_name: Name of the paying corporation
- tax_year: Year on the form
- box_13: Taxable amount of dividends
- box_14: Capital gains dividends
- box_15: Return of capital
- box_16: Other income
- box_25: Foreign income
- box_26: Foreign tax paid`;

export const GENERIC_PROMPT = `${EXTRACTION_SYSTEM_PROMPT}

Analyze this document and extract all structured data you can find. Look for:
- Document title/type
- Dates (issue date, due date, etc.)
- Names and addresses
- Amounts and totals
- Reference numbers
- Any structured fields visible

Be thorough —extract every piece of identifiable information.`;

/**
 * Get the appropriate prompt based on detected or requested document type
 */
export function getPromptForDocType(docType: string): string {
  switch (docType) {
    case 'receipt':
    case 'invoice':
      return RECEIPT_PROMPT;
    case 't4':
      return T4_PROMPT;
    case 't5':
    case 't3':
      return T5_PROMPT;
    default:
      return GENERIC_PROMPT;
  }
}
