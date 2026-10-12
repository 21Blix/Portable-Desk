/**
 * Parses user page range input such as:
 * - "1-5" -> [1, 2, 3, 4, 5]
 * - "1, 3, 5" -> [1, 3, 5]
 * - "1-3, 7, 10-12" -> [1, 2, 3, 7, 10, 11, 12]
 *
 * All page numbers returned are 1-indexed.
 */
export function parsePageRange(
  input: string,
  totalPages: number,
  allowDuplicates = false
): { valid: boolean; pages: number[]; error?: string } {
  const cleaned = input.trim();
  if (!cleaned) {
    return { valid: false, pages: [], error: 'Please enter at least one page number or range.' };
  }

  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  const result: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        return { valid: false, pages: [], error: `Invalid range format: "${part}"` };
      }

      if (start < 1) {
        return { valid: false, pages: [], error: `Page numbers must be 1 or greater (got ${start})` };
      }

      if (end > totalPages) {
        return {
          valid: false,
          pages: [],
          error: `Range "${part}" exceeds maximum page count of ${totalPages}`,
        };
      }

      const step = start <= end ? 1 : -1;
      for (let p = start; step > 0 ? p <= end : p >= end; p += step) {
        if (!allowDuplicates && seen.has(p)) continue;
        seen.add(p);
        result.push(p);
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        return { valid: false, pages: [], error: `"${part}" is not a valid page number` };
      }
      if (page < 1 || page > totalPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${page} is outside document boundaries (1 to ${totalPages})`,
        };
      }
      if (!allowDuplicates && seen.has(page)) continue;
      seen.add(page);
      result.push(page);
    }
  }

  if (result.length === 0) {
    return { valid: false, pages: [], error: 'No valid pages found in input.' };
  }

  return { valid: true, pages: result };
}
