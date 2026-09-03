import {
  LegalBlock,
  LegalTextMark,
} from "./legal.types";

/* ============================================================
   legal.render.ts — blocks → HTML (server-side, XSS-safe)

   Har text esc() se escape hota hai, colors validation me
   already hex-only hain, isliye output HTML safe hai.
   Output me milta hai: h1–h4, p, ul/ol/li, blockquote (callout),
   hr, table, aur inline <strong>/<em>/<u>/<a>/<span style="color">.

   Flutter: flutter_html package se content.html direct render karo.
   Web:     dangerouslySetInnerHTML use kar sakte ho KYUNKI ye HTML
            sirf server ne banaya hai, kabhi user input as-is nahi.
   ============================================================ */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMark(m: LegalTextMark): string {
  let html = esc(m.text || "");

  if (m.bold) html = `<strong>${html}</strong>`;
  if (m.italic) html = `<em>${html}</em>`;
  if (m.underline) html = `<u>${html}</u>`;

  const styles: string[] = [];
  if (m.color) styles.push(`color:${m.color}`);
  if (m.backgroundColor) styles.push(`background-color:${m.backgroundColor}`);
  if (styles.length) html = `<span style="${styles.join(";")}">${html}</span>`;

  if (m.link) html = `<a href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">${html}</a>`;

  return html;
}

function renderMarks(content?: LegalTextMark[]): string {
  return (content || []).map(renderMark).join("");
}

export function renderBlocksToHtml(blocks: LegalBlock[]): string {
  const out: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const level = Math.min(Math.max(block.level, 1), 4);
        out.push(`<h${level}>${renderMarks(block.content)}</h${level}>`);
        break;
      }

      case "paragraph":
        out.push(`<p>${renderMarks(block.content)}</p>`);
        break;

      case "quote":
        /* App/website isko pink callout box style dete hain */
        out.push(
          `<blockquote class="legal-callout">${renderMarks(block.content)}</blockquote>`,
        );
        break;

      case "bulletList":
        out.push(
          `<ul>${block.items
            .map((it) => `<li>${renderMarks(it.content)}</li>`)
            .join("")}</ul>`,
        );
        break;

      case "numberedList":
        out.push(
          `<ol>${block.items
            .map((it) => `<li>${renderMarks(it.content)}</li>`)
            .join("")}</ol>`,
        );
        break;

      case "divider":
        out.push(`<hr />`);
        break;

      case "table": {
        const head = `<thead><tr>${block.headers
          .map((h) => `<th>${renderMarks(h.content)}</th>`)
          .join("")}</tr></thead>`;
        const body = `<tbody>${block.rows
          .map(
            (r) =>
              `<tr>${r.cells
                .map((c) => `<td>${renderMarks(c.content)}</td>`)
                .join("")}</tr>`,
          )
          .join("")}</tbody>`;
        out.push(`<table class="legal-table">${head}${body}</table>`);
        break;
      }
    }
  }

  return out.join("\n");
}