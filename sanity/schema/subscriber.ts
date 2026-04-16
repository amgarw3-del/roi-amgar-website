import { defineField, defineType } from "sanity";

export default defineType({
  name: "subscriber",
  title: "מנוי רשימת דיוור",
  type: "document",
  fields: [
    defineField({ name: "name", title: "שם", type: "string", validation: (r) => r.required() }),
    defineField({ name: "phone", title: "טלפון", type: "string" }),
    defineField({ name: "email", title: "אימייל", type: "string", validation: (r) => r.required() }),
    defineField({ name: "createdAt", title: "תאריך הרשמה", type: "datetime" }),
  ],
});
