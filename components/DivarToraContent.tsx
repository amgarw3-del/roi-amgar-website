import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";

interface Props {
  content: string;
}

export default function DivarToraContent({ content }: Props) {
  return (
    <div className="prose-hebrew leading-loose text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props: ComponentPropsWithoutRef<"p">) => (
            <p className="mb-5 leading-loose" {...props} />
          ),
          strong: (props: ComponentPropsWithoutRef<"strong">) => (
            <strong
              style={{ color: "var(--color-primary)", fontWeight: 700 }}
              {...props}
            />
          ),
          em: (props: ComponentPropsWithoutRef<"em">) => (
            <em className="italic" {...props} />
          ),
          blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote className="dvar-quote" {...props} />
          ),
          h2: (props: ComponentPropsWithoutRef<"h2">) => (
            <h2
              className="text-xl font-bold mt-8 mb-3"
              style={{ color: "var(--color-primary)" }}
              {...props}
            />
          ),
          h3: (props: ComponentPropsWithoutRef<"h3">) => (
            <h3
              className="text-lg font-bold mt-6 mb-2"
              style={{ color: "var(--color-primary)" }}
              {...props}
            />
          ),
          ul: (props: ComponentPropsWithoutRef<"ul">) => (
            <ul className="list-disc pr-6 mb-4 space-y-1" {...props} />
          ),
          ol: (props: ComponentPropsWithoutRef<"ol">) => (
            <ol className="list-decimal pr-6 mb-4 space-y-1" {...props} />
          ),
          a: (props: ComponentPropsWithoutRef<"a">) => (
            <a
              className="underline"
              style={{ color: "var(--color-accent)" }}
              {...props}
            />
          ),
          hr: () => (
            <hr
              className="my-6 border-0 h-px"
              style={{ background: "var(--color-line)" }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
