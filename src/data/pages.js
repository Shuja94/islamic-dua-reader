const categories = [
  "ކަވަރ",
  "ފާފަ ފުއްސެވުމުގެ ދުޢާ",
  "ޙިމާޔަތުގެ ދުޢާ",
  "ރިޒްޤުގެ ދުޢާ",
  "އާއިލާއާ ބެހޭ ދުޢާ",
  "ނަމާދާ ބެހޭ ދުޢާ",
  "ޤުރްއާނުގެ ދުޢާ",
];

const categoryByPage = (page) => {
  if (page === 1) return categories[0];
  if (page <= 8) return categories[1];
  if (page <= 15) return categories[2];
  if (page <= 21) return categories[3];
  if (page <= 27) return categories[4];
  if (page <= 34) return categories[5];
  return categories[6];
};

const pad = (page) => String(page).padStart(3, "0");

export const pages = Array.from({ length: 42 }, (_, index) => {
  const page = index + 1;
  const category = categoryByPage(page);

  return {
    page,
    title: page === 1 ? "ކަވަރ" : `${category} - ޞަފްޙާ ${page}`,
    category,
    imageWebp: `/pages/page-${pad(page)}.webp`,
    imageJpg: `/pages/page-${pad(page)}.jpg`,
    audio: `/audio/page-${pad(page)}.mp3`,
  };
});

export const pageCategories = categories;
