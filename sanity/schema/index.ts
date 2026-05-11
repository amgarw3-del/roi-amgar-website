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
import { lectureFaqSchema } from "./lectureFaq";
import { homepageSchema } from "./homepage";
import { pdfSummarySchema } from "./pdfSummary";
import { weddingTestimonialSchema } from "./weddingTestimonial";
import { weddingGalleryImageSchema } from "./weddingGalleryImage";
import { siteStatsSchema } from "./siteStats";
import { eventImageSchema } from "./eventImage";

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
  lectureFaqSchema,
  homepageSchema,
  pdfSummarySchema,
  weddingTestimonialSchema,
  weddingGalleryImageSchema,
  siteStatsSchema,
  eventImageSchema,
];
