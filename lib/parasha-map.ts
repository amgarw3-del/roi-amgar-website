export const ALL_SUBTOPIC_SLUGS = {
  parasha: [
    "bereshit","noach","lech-lecha","vayera","chayei-sara","toldot",
    "vayetze","vayishlach","vayeshev","miketz","vayigash","vayechi",
    "shemot","vaera","bo","beshalach","yitro","mishpatim","teruma",
    "tetzave","ki-tisa","vayakhel","pekudei","vayikra","tzav","shmini",
    "tazria","metzora","acharei-mot","kedoshim","emor","behar","bechukotai",
    "bamidbar","naso","behaalotcha","shelach","korach","chukat","balak",
    "pinchas","matot","masei","devarim","vaetchanan","ekev","ree",
    "shoftim","ki-tetze","ki-tavo","nitzavim","vayelech","haazinu","vezot-habracha",
  ],
  moed: [
    "rosh-hashana","yom-kippur","sukkot","hoshana-raba","shmini-atzeret",
    "chanuka","tu-bishvat","purim","purim-shushan","pesach",
    "sfirat-haomer","lag-baomer","shavuot","tu-beav",
  ],
  fast: [
    "tzom-gedalia","asara-betevet","taanit-esther",
    "shiva-asar-betamuz","tisha-beav",
  ],
  national: [
    "yom-hashoah","yom-hazikaron","yom-haatzmaut","yom-yerushalayim",
  ],
};

export const ALL_SLUGS_FLAT: string[] = [
  ...ALL_SUBTOPIC_SLUGS.parasha,
  ...ALL_SUBTOPIC_SLUGS.moed,
  ...ALL_SUBTOPIC_SLUGS.fast,
  ...ALL_SUBTOPIC_SLUGS.national,
];

// פרשת השבוע הנוכחית (ניסן תשפ"ו — אפריל 2026)
export const CURRENT_PARASHA = ["tazria", "metzora"];

export function slugToRef(slug: string) {
  return { _type: "reference" as const, _ref: `subTopic-${slug}`, _key: slug };
}

export function validateAndBuildRefs(slugs: string[]) {
  return slugs
    .filter((s) => ALL_SLUGS_FLAT.includes(s))
    .map(slugToRef);
}
