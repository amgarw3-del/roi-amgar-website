"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft } from "lucide-react";

interface SubTopic {
  _id: string;
  hebrewName: string;
  slug: { current: string };
  group: "moed" | "parasha" | "fast" | "national";
}

interface Props {
  subTopics: SubTopic[];
  activeSub: string | null;
  /** אם מוגדר — מציג רק את הקבוצות האלו */
  filterGroups?: string[];
  /** קישור "כל הנושאים" / "כל דברי התורה" */
  allHref?: string;
  allLabel?: string;
}

const GROUP_ORDER = ["moed", "parasha", "fast", "national"] as const;

const GROUP_LABELS: Record<string, string> = {
  moed: "מועדים",
  parasha: "פרשת שבוע",
  fast: "צומות",
  national: "מועדים לאומיים",
};

// מיפוי פרשיות לחומשים — לפי slugs
const CHUMASHIM: { name: string; slugs: string[] }[] = [
  {
    name: "ספר בראשית",
    slugs: ["bereshit","noach","lech-lecha","vayera","chayei-sara","toldot","vayetze","vayishlach","vayeshev","miketz","vayigash","vayechi"],
  },
  {
    name: "ספר שמות",
    slugs: ["shemot","vaera","bo","beshalach","yitro","mishpatim","teruma","tetzave","ki-tisa","vayakhel","pekudei"],
  },
  {
    name: "ספר ויקרא",
    slugs: ["vayikra","tzav","shmini","tazria","metzora","acharei-mot","kedoshim","emor","behar","bechukotai"],
  },
  {
    name: "ספר במדבר",
    slugs: ["bamidbar","naso","behaalotcha","shelach","korach","chukat","balak","pinchas","matot","masei"],
  },
  {
    name: "ספר דברים",
    slugs: ["devarim","vaetchanan","ekev","ree","shoftim","ki-tetze","ki-tavo","nitzavim","vayelech","haazinu","vezot-habracha"],
  },
];

function findActiveGroup(subTopics: SubTopic[], activeSub: string | null): string | null {
  if (!activeSub) return null;
  return subTopics.find((st) => st.slug.current === activeSub)?.group ?? null;
}

function findActiveChumash(activeSub: string | null): string | null {
  if (!activeSub) return null;
  return CHUMASHIM.find((c) => c.slugs.includes(activeSub))?.name ?? null;
}

export default function SubTopicSidebar({
  subTopics,
  activeSub,
  filterGroups,
  allHref = "/dvar-tora",
  allLabel = "כל הנושאים",
}: Props) {
  const activeGroup = findActiveGroup(subTopics, activeSub);
  const activeChumash = findActiveChumash(activeSub);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (activeGroup) return { [activeGroup]: true };
    return {};
  });

  const [openChumashim, setOpenChumashim] = useState<Record<string, boolean>>(() => {
    if (activeChumash) return { [activeChumash]: true };
    return {};
  });

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const toggleChumash = (name: string) =>
    setOpenChumashim((prev) => ({ ...prev, [name]: !prev[name] }));

  const visibleGroups = GROUP_ORDER.filter((g) => {
    if (filterGroups && !filterGroups.includes(g)) return false;
    return subTopics.some((st) => st.group === g);
  });

  return (
    <nav className="flex flex-col gap-0.5 text-sm" dir="rtl">
      {/* "כל הנושאים" — הסתר אם יש filterGroups */}
      {!filterGroups && (
        <Link
          href={allHref}
          className={`flex items-center px-3 py-2 rounded-lg font-semibold transition-colors mb-1 ${
            !activeSub ? "text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
          style={!activeSub ? { background: "var(--color-primary)" } : {}}
        >
          {allLabel}
        </Link>
      )}

      {visibleGroups.map((group) => {
        const items = subTopics.filter((st) => st.group === group);
        if (items.length === 0) return null;
        const isOpen = !!openGroups[group];
        const isGroupActive = activeGroup === group;

        return (
          <div key={group} className="mb-1">
            {/* כותרת קבוצה — ניתנת ללחיצה */}
            <button
              onClick={() => toggleGroup(group)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-colors ${
                isGroupActive
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={isGroupActive ? { background: "var(--color-primary)" } : {}}
            >
              <span>{GROUP_LABELS[group]}</span>
              {isOpen
                ? <ChevronDown size={14} className="flex-shrink-0" />
                : <ChevronLeft size={14} className="flex-shrink-0" />}
            </button>

            {/* תוכן הקבוצה */}
            {isOpen && (
              <div className="mt-0.5 pr-2">
                {group === "parasha" ? (
                  /* פרשיות — מחולקות לחומשים */
                  <div className="flex flex-col gap-0.5">
                    {CHUMASHIM.map((chumash) => {
                      const chumashItems = items.filter((st) =>
                        chumash.slugs.includes(st.slug.current)
                      );
                      if (chumashItems.length === 0) return null;
                      const isChumashOpen = !!openChumashim[chumash.name];
                      const isChumashActive = chumashItems.some(
                        (st) => st.slug.current === activeSub
                      );

                      return (
                        <div key={chumash.name}>
                          {/* כותרת חומש */}
                          <button
                            onClick={() => toggleChumash(chumash.name)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                              isChumashActive
                                ? "text-white"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                            style={
                              isChumashActive
                                ? { background: "var(--color-accent)" }
                                : {}
                            }
                          >
                            <span>{chumash.name}</span>
                            {isChumashOpen
                              ? <ChevronDown size={12} className="flex-shrink-0" />
                              : <ChevronLeft size={12} className="flex-shrink-0" />}
                          </button>

                          {/* פרשות */}
                          {isChumashOpen && (
                            <div className="pr-2 mt-0.5 flex flex-col gap-0.5">
                              {chumashItems.map((st) => {
                                const isActive = activeSub === st.slug.current;
                                return (
                                  <Link
                                    key={st._id}
                                    href={`/dvar-tora?sub=${st.slug.current}`}
                                    className={`block px-2 py-1 rounded-md text-xs transition-colors ${
                                      isActive
                                        ? "font-semibold text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    style={isActive ? { background: "var(--color-accent)" } : {}}
                                  >
                                    {st.hebrewName}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* שאר הקבוצות — רשימה ישירה */
                  <div className="flex flex-col gap-0.5">
                    {items.map((st) => {
                      const isActive = activeSub === st.slug.current;
                      return (
                        <Link
                          key={st._id}
                          href={`/dvar-tora?sub=${st.slug.current}`}
                          className={`block px-3 py-1 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "font-semibold text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          style={isActive ? { background: "var(--color-accent)" } : {}}
                        >
                          {st.hebrewName}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
