import { categorySchema } from "./category";
import { videoSchema } from "./video";
import { blogPostSchema } from "./blogPost";
import { qnaSchema } from "./qna";
import { scanStatusSchema } from "./scanStatus";
import subscriberSchema from "./subscriber";
import { divarToraSchema } from "./divarTora";
import { subTopicSchema } from "./subTopic";
import { lectureSchema } from "./lecture";
import { testimonialSchema } from "./testimonial";
import { lectureGalleryImageSchema } from "./lectureGalleryImage";

export const schemaTypes = [
  categorySchema,
  subTopicSchema,
  videoSchema,
  blogPostSchema,
  qnaSchema,
  divarToraSchema,
  scanStatusSchema,
  subscriberSchema,
  lectureSchema,
  testimonialSchema,
  lectureGalleryImageSchema,
];
