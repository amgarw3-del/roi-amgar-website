import { categorySchema } from "./category";
import { videoSchema } from "./video";
import { blogPostSchema } from "./blogPost";
import { qnaSchema } from "./qna";
import { scanStatusSchema } from "./scanStatus";

export const schemaTypes = [
  categorySchema,
  videoSchema,
  blogPostSchema,
  qnaSchema,
  scanStatusSchema,
];
