import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  SectionType,
} from "docx";
import * as JSZip from "jszip";

const HE = { bidirectional: "he-IL" };

function rtlRun(opts: ConstructorParameters<typeof TextRun>[0]) {
  return new TextRun({ rightToLeft: true, language: HE, ...(opts as object) } as ConstructorParameters<typeof TextRun>[0]);
}

function rtlParagraph(opts: ConstructorParameters<typeof Paragraph>[0]) {
  return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, ...(opts as object) } as ConstructorParameters<typeof Paragraph>[0]);
}

function forceRtlOnAllParagraphs(documentXml: string): string {
  // For every <w:p ...> ensure <w:pPr> exists with <w:bidi/> + <w:jc w:val="right"/>
  // and that those elements appear in the schema-correct order (bidi before jc).
  return documentXml.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/g, (_match, attrs, inner) => {
    const hasPPr = /<w:pPr\b/.test(inner);
    if (!hasPPr) {
      return `<w:p${attrs}><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>${inner}</w:p>`;
    }
    const fixed = inner.replace(/<w:pPr\b([^>]*)>([\s\S]*?)<\/w:pPr>/, (_m: string, pAttrs: string, pInner: string) => {
      // Strip any existing bidi / jc so we control placement.
      let cleaned = pInner.replace(/<w:bidi\s*\/?>/g, "").replace(/<w:jc\b[^/]*\/>/g, "");
      // Insert bidi before jc; jc will be appended at the proper position (end of pPr is fine for jc).
      // Place <w:bidi/> right at the start, and <w:jc w:val="right"/> at the very end of pPr.
      cleaned = `<w:bidi/>${cleaned}<w:jc w:val="right"/>`;
      return `<w:pPr${pAttrs}>${cleaned}</w:pPr>`;
    });
    return `<w:p${attrs}>${fixed}</w:p>`;
  });
}

async function patchRtlSettings(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  // Force RTL + right-alignment on every paragraph in document.xml
  const docFile = zip.file("word/document.xml");
  if (docFile) {
    const xml = await docFile.async("string");
    zip.file("word/document.xml", forceRtlOnAllParagraphs(xml));
  }

  // Inject Hebrew language defaults into styles.xml (rPrDefault + pPrDefault)
  const stylesFile = zip.file("word/styles.xml");
  if (stylesFile) {
    const stylesXml = await stylesFile.async("string");
    const patched = stylesXml.replace(
      /<w:docDefaults>[\s\S]*?<\/w:docDefaults>/,
      `<w:docDefaults><w:rPrDefault><w:rPr><w:rtl/><w:lang w:val="he-IL" w:eastAsia="he-IL" w:bidi="he-IL"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr></w:pPrDefault></w:docDefaults>`
    );
    zip.file("word/styles.xml", patched);
  }

  // Inject theme font language and document-level bidi into settings.xml
  const settingsFile = zip.file("word/settings.xml");
  if (settingsFile) {
    const settingsXml = await settingsFile.async("string");
    const patched = settingsXml.replace(
      "</w:settings>",
      `<w:themeFontLang w:val="he-IL" w:bidi="he-IL"/><w:bidi/></w:settings>`
    );
    zip.file("word/settings.xml", patched);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

export async function generateDvarDocx(
  title: string,
  content: string
): Promise<Buffer> {
  const headerParagraph = rtlParagraph({
    spacing: { after: 160 },
    children: [
      rtlRun({ text: 'בס"ד', font: "Arial", size: 24, bold: true }),
      new TextRun({ text: "\t", font: "Arial", size: 24, rightToLeft: true }),
      rtlRun({ text: `${title} / הרב רועי אמגר`, font: "Arial", size: 28, bold: true, underline: {} }),
    ],
  });

  const divider = rtlParagraph({
    spacing: { after: 160 },
    children: [rtlRun({ text: "—".repeat(30), font: "Arial", size: 20 })],
  });

  const contentParagraphs = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      rtlParagraph({
        spacing: { after: 120, line: 320 },
        children: [rtlRun({ text: line, font: "Arial", size: 24 })],
      })
    );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24, rightToLeft: true, language: HE },
          paragraph: { alignment: AlignmentType.RIGHT },
        },
      },
    },
    sections: [
      {
        properties: { type: SectionType.CONTINUOUS },
        children: [headerParagraph, divider, ...contentParagraphs],
      },
    ],
  });

  const rawBuffer = Buffer.from(await Packer.toBuffer(doc));
  return patchRtlSettings(rawBuffer);
}
