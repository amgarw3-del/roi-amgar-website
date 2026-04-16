import { categorySchema } from "./category";
import { videoSchema } from "./video";
import { blogPostSchema } from "./blogPost";
import { qnaSchema } from "./qna";
import { scanStatusSchema } from "./scanStatus";
import subscriberSchema from "./subscriber";

export const schemaTypes = [
  categorySchema,
  videoSchema,
  blogPostSchema,
  qnaSchema,
  scanStatusSchema,
  subscriberSchema,
];
