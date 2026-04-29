import { createClient } from "@sanity/client";
import { createImageUrlBuilder as imageUrlBuilder } from "@sanity/image-url";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Reusable GROQ queries
export const queries = {
  // שיעורים אחרונים
  latestVideos: (limit = 6) =>
    `*[_type == "video" && status == "published" && hidden != true] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, category->{hebrewName, slug}, summary, publishedAt, youtubeId, platform, level
    }`,

  // פוסטים אחרונים
  latestPosts: (limit = 4) =>
    `*[_type == "blogPost"] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, category->{hebrewName, slug}, body[0...1], publishedAt, level
    }`,

  // שאלות ותשובות אחרונות
  latestQna: (limit = 3) =>
    `*[_type == "qna" && isPublic == true] | order(publishedAt desc) [0...${limit}] {
      _id, question, answer, slug, category->{hebrewName, slug}, publishedAt, answerType
    }`,

  // לפי קטגוריה
  byCategory: (categorySlug: string, type: string, limit = 12) =>
    `*[_type == "${type}" && category->slug.current == "${categorySlug}" && status == "published" && (hidden != true || _type != "video")] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, summary, publishedAt, youtubeId, level
    }`,

  // שיעור בודד
  videoBySlug: (slug: string) =>
    `*[_type == "video" && slug.current == "${slug}" && hidden != true][0] {
      _id, title, slug, category->{hebrewName, slug}, summary, transcript, publishedAt, youtubeId, platform, level, hebrewDate
    }`,

  // פוסט בודד
  postBySlug: (slug: string) =>
    `*[_type == "blogPost" && slug.current == "${slug}"][0] {
      _id, title, slug, category->{hebrewName, slug}, body, publishedAt, level, hebrewDate, source
    }`,

  // שאלה בודדת
  qnaBySlug: (slug: string) =>
    `*[_type == "qna" && slug.current == "${slug}" && isPublic == true][0] {
      _id, question, answer, questionType, answerType, category->{hebrewName, slug}, publishedAt, hebrewDate
    }`,

  // חיפוש גלובלי
  search: (query: string) =>
    `*[
      (
        _type == "video" || _type == "blogPost" || _type == "qna"
      ) && (
        title match "${query}*" ||
        summary match "${query}*" ||
        question match "${query}*"
      ) && (_type != "video" || hidden != true)
    ] | order(_score desc) [0...20] {
      _id, _type, title, question, slug, category->{hebrewName, slug}, publishedAt
    }`,

  // כל הקטגוריות
  allCategories: `*[_type == "category"] | order(name asc) {
    _id, name, hebrewName, slug, description
  }`,

  // דברי תורה אחרונים
  latestDivarTora: (limit = 6) =>
    `*[_type == "divarTora" && status == "published"] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, teaser, category->{hebrewName, slug}, publishedAt,
      extraCategories[]->{hebrewName, slug},
      subTopics[]->{hebrewName, slug}
    }`,

  // דברי תורה לפי קטגוריה (כולל extraCategories)
  divarToraByCategory: (categorySlug: string, limit = 12) =>
    `*[_type == "divarTora" && status == "published" && (
      category->slug.current == "${categorySlug}" ||
      "${categorySlug}" in extraCategories[]->slug.current
    )] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, teaser, publishedAt,
      category->{hebrewName, slug},
      extraCategories[]->{hebrewName, slug},
      subTopics[]->{hebrewName, slug}
    }`,

  // דבר תורה בודד
  divarToraBySlug: (slug: string) =>
    `*[_type == "divarTora" && slug.current == "${slug}" && status == "published"][0] {
      _id, title, slug, teaser, content, category->{hebrewName, slug}, publishedAt, hebrewDate, sourceType,
      extraCategories[]->{hebrewName, slug},
      subTopics[]->{hebrewName, slug}
    }`,

  // דברי תורה לפי תת-נושא
  divarToraBySubTopic: (subTopicSlug: string, limit = 24) =>
    `*[_type == "divarTora" && status == "published" && "${subTopicSlug}" in subTopics[]->slug.current] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, teaser, publishedAt, category->{hebrewName, slug},
      extraCategories[]->{hebrewName, slug},
      subTopics[]->{hebrewName, slug}
    }`,

  // כל תתי-הנושאים לסרגל
  allSubTopics: `*[_type == "subTopic"] | order(group asc, order asc) {
    _id, hebrewName, slug, group
  }`,

  // סטטוס סריקה (לאוטומציה)
  scanStatus: `*[_type == "scanStatus"][0] {
    lastScannedAt, latestVideoId, latestPostId
  }`,

  // הרצאות
  allLectures: `*[_type == "lecture" && published == true] | order(order asc, _createdAt desc) {
    _id, title, summary, flyer
  }`,

  featuredLectures: (limit = 3) =>
    `*[_type == "lecture" && published == true] | order(order asc, _createdAt desc) [0...${limit}] {
      _id, title, flyer
    }`,

  // המלצות על הרצאות
  allTestimonials: `*[_type == "testimonial"] | order(order asc, _createdAt desc) {
    _id, quote, name, role, photo
  }`,

  // גלריית הרצאות
  allLectureGallery: `*[_type == "lectureGalleryImage"] | order(order asc, _createdAt desc) {
    _id, image, caption
  }`,

  // שאלות נפוצות בעמוד ההרצאות
  allLectureFaqs: `*[_type == "lectureFaq" && published == true] | order(order asc, _createdAt desc) {
    _id, question, answer
  }`,

  // הגדרות עמוד הבית
  homepage: `*[_type == "homepage"][0] {
    heroTitle, heroSubtitle, heroImage, heroCtaLabel, heroCtaHref,
    blocks
  }`,
};
