import { useEffect, useMemo, useRef, useState } from "react";
import { pages, pageCategories } from "./data/pages";
import {
  addBookmark,
  clampPage,
  copyShareText,
  createShareText,
  getAutoContinueDelay,
  getProgress,
  loadBookmarks,
  loadLastPage,
  removeBookmark,
  saveBookmarks,
  saveLastPage,
  searchPages,
} from "./utils/reader";

const totalPages = pages.length;

const zoomLabels = {
  small: "ކުޑަ",
  medium: "މެދު",
  large: "ބޮޑު",
  xlarge: "ވަރަށް ބޮޑު",
};

function PageImage({ page, zoom, locked, onPrevious, onNext }) {
  const [source, setSource] = useState(page.imageWebp);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(page.imageWebp);
    setFailed(false);
  }, [page.imageWebp]);

  const handleTap = (event) => {
    if (locked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.clientX < rect.left + rect.width / 2 ? onPrevious() : onNext();
  };

  if (failed) {
    return (
      <button className={`book-page missing-page zoom-${zoom}`} type="button" onClick={handleTap}>
        <span>ޞަފްޙާ {page.page}</span>
        <strong>ޞަފްޙާ ލޯޑު ނުވެއްޖެ.</strong>
        <p>އިންޓަނެޓް ޗެކްކޮށް އަލުން މަސައްކަތްކޮށްލައްވާ.</p>
      </button>
    );
  }

  return (
    <button className={`book-page zoom-${zoom}`} type="button" onClick={handleTap} aria-label={`Page ${page.page}`}>
      <img
        src={source}
        alt={`${page.title}, page ${page.page}`}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (source !== page.imageJpg) {
            setSource(page.imageJpg);
            return;
          }
          setFailed(true);
        }}
      />
    </button>
  );
}

function Home({ lastPage, bookmarks, openReader }) {
  return (
    <main className="home-screen">
      <section className="home-layout">
        <div className="cover-card">
          <div className="cover-glow" />
          <img src="/cover.svg" alt="ފޮތުގެ ކަވަރ" />
          <div className="cover-caption">
            <span>42 ޞަފްޙާ</span>
            <span>އިމޭޖް ރީޑަރ</span>
          </div>
        </div>

        <div className="home-copy">
          <p className="kicker">އިސްލާމީ ފޮތް ކިޔާ އެޕް</p>
          <h1>ދުޢާ ފޮތް</h1>
          <p>
            މުސްކުޅި ބޭފުޅުންނަށް ފަސޭހަ، ލަސްނުވާ، އަދި ސާފު ކިޔުމެއް.
            އަރަބި އަދި ދިވެހި ލިޔުން ފޮތުގައި ހުރި ގޮތަށް ސައްޙަކޮށް ދައްކާނެ.
          </p>

          <div className="home-actions">
            <button className="primary-btn" type="button" onClick={() => openReader(1)}>
              ކިޔަން ފަށާ
            </button>
            {lastPage > 1 && (
              <button className="soft-btn" type="button" onClick={() => openReader(lastPage)}>
                ޞަފްޙާ {lastPage} އިން ކުރިއަށް
              </button>
            )}
