/**
 * Math delimiter normalizer and currency preprocessor for ReactMarkdown + KaTeX.
 *
 * 1. Preserves code fences (```...```) and inline code (`...`) untouched.
 * 2. Normalizes LaTeX display math: \[ ... \] -> $$ ... $$
 * 3. Normalizes LaTeX inline math: \( ... \) -> $ ... $
 * 4. Escapes currency dollar signs ($10, $5/mo, $100.50) so they do not collide
 *    with KaTeX inline math delimiters.
 */
export function normalizeMathDelimiters(text: string): string {
  if (!text) return "";

  // Split into alternating non-code and code segments
  const tokenRegex = /(```[\s\S]*?```|`[^`\n]*`)/g;
  const parts = text.split(tokenRegex);

  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];

    // Convert display math: \[ ... \] -> \n$$\n...\n$$\n
    segment = segment.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
      return `\n$$\n${equation.trim()}\n$$\n`;
    });

    // Convert inline math: \( ... \) -> $...$
    segment = segment.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
      return `$${equation.trim()}$`;
    });

    // Protect currency patterns: $ followed by digits (e.g., $10, $20.50, $5/mo)
    segment = segment.replace(
      /(^|[\s(\[])\$(\d[\d,]*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|usd|\/mo|\/month|\/yr|\/year))?)(?=\s+(?:and|to|or|vs|for|-)\s+\$|\s*[,.;:)\]?!]|\s*$|\s+[a-zA-Z])/gi,
      "$1\\$$$2"
    );

    parts[i] = segment;
  }

  return parts.join("");
}
