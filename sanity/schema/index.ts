import { categorySchema } from "./category";
import { videoSchema } from "./video";
import { blogPostSchema } from "./blogPost";
import { qnaSchema } from "./qna";
import { scanStatusSchema } from "./scanStatus";
import subscriberSchema from "./subscriber";
import { divarToraSchema } from "./divarTora";

export const schemaTypes = [
  categorySchema,
  videoSchema,
  blogPostSchema,
  qnaSchema,
  divarToraSchema,
  scanStatusSchema,
  subscriberSchema,
];
