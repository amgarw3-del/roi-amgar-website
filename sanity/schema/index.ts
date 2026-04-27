import { categorySchema } from "./category";
import { videoSchema } from "./video";
import { blogPostSchema } from "./blogPost";
import { qnaSchema } from "./qna";
import { scanStatusSchema } from "./scanStatus";
import subscriberSchema from "./subscriber";
import { divarToraSchema } from "./divarTora";
import { subTopicSchema } from "./subTopic";

export const schemaTypes = [
  categorySchema,
  subTopicSchema,
  videoSchema,
  blogPostSchema,
  qnaSchema,
  divarToraSchema,
  scanStatusSchema,
  subscriberSchema,
];
