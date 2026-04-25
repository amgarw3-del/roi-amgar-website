import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  SectionType,
} from "docx";

export async function generateDvarDocx(
  title: string,
  content: string
): Promise<Buffer> {
  const headerParagraph = new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 160 },
    children: [
      new TextRun({ text: 'בס"ד', font: "Arial", size: 24, bold: true, rightToLeft: true }),
      new TextRun({ text: "\t", font: "Arial", size: 24 }),
      new TextRun({ text: `${title} / הרב רועי אמגר`, font: "Arial", size: 28, bold: true, underline: {}, rightToLeft: true }),
    ],
  });

  const divider = new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 160 },
    children: [new TextRun({ text: "—".repeat(30), font: "Arial", size: 20 })],
  });

  const contentParagraphs = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(
      (line) =>
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: line, font: "Arial", size: 24, rightToLeft: true }),
          ],
        })
    );

  const doc = new Document({
    sections: [
      {
        properties: { type: SectionType.CONTINUOUS },
        children: [headerParagraph, divider, ...contentParagraphs],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
