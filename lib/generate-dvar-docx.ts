import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  SectionType,
} from "docx";

const HE = { bidirectional: "he-IL" };

function rtlRun(opts: ConstructorParameters<typeof TextRun>[0]) {
  return new TextRun({ rightToLeft: true, language: HE, ...(opts as object) } as ConstructorParameters<typeof TextRun>[0]);
}

function rtlParagraph(opts: ConstructorParameters<typeof Paragraph>[0]) {
  return new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, ...(opts as object) } as ConstructorParameters<typeof Paragraph>[0]);
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

  return Buffer.from(await Packer.toBuffer(doc));
}
