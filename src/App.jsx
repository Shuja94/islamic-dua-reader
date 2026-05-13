import { useEffect, useMemo, useRef, useState } from "react";
import { pages, pageCategories } from "./data/pages";
import { addBookmark, clampPage, copyShareText, createShareText, getAutoContinueDelay, getProgress, loadBookmarks, loadLastPage, removeBookmark, saveBookmarks, saveLastPage, searchPages } from "./utils/reader";

const totalPages = pages.length;
const zoomLabels = { small: "Small", medium: "Medium", large: "Large", xlarge: "Extra Large" };
const zoomClass = { small: "page-small", medium: "page-medium", large: "page-large", xlarge: "page-xlarge" };

function PageImage({ page, zoom, onTap }) {
  const [source, setSource] = useState(page.imageWebp);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setSource(page.imageWebp); setFailed(false); }, [page.page, page.imageWebp]);
  if (failed) return <div className="page-error">Page could not load. Please check internet or try again.</div>;
  return <button className={`page-shell ${zoomClass[zoom]}`} type="button" onClick={onTap} aria-label={`Page ${page.page}`}><img src={source} alt={`${page.title}, page ${page.page}`} loading="lazy" decoding="async" onError={() => source !== page.imageJpg ? setSource(page.imageJpg) : setFailed(true)} /></button>;
}

function Home({ lastPage, bookmarks, goReader }) {
  return <main className="home-screen"><section className="home-content"><div className="cover-frame"><img src="/cover.svg" alt="Book cover" /></div><div className="home-copy"><p className="eyebrow">Islamic Book Reader</p><h1>Islamic Dua Reader</h1><p>A gentle page-image reader for Dhivehi and Arabic pages, designed with large controls and calm reading modes.</p><div className="home-actions"><button className="primary-btn" onClick={() => goReader(1)}>Start Reading</button>{lastPage > 1 && <button className="secondary-btn" onClick={() => goReader(lastPage)}>Continue from Page {lastPage}</button>}</div>{bookmarks.length > 0 && <section className="saved-box"><h2>My Saved Pages</h2><div className="saved-list">{bookmarks.map((page) => <button key={page} onClick={() => goReader(page)}>Page {page}</button>)}</div></section>}</div></section></main>;
}

function ContentsPanel({ open, query, setQuery, results, jumpToPage, close }) {
  if (!open) return null;
  return <aside className="contents-panel" aria-label="Table of contents"><div className="panel-head"><h2>Contents</h2><button className="icon-btn" onClick={close} aria-label="Close contents">Close</button></div><label className="search-label">Search page or dua title<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Page number or category" /></label><div className="category-list">{pageCategories.map((category) => <button key={category} onClick={() => jumpToPage(pages.find((page) => page.category === category)?.page || 1)}>{category}</button>)}</div><div className="toc-results">{results.map((page) => <button key={page.page} onClick={() => jumpToPage(page.page)}><span>Page {page.page}</span><strong>{page.title}</strong></button>)}</div></aside>;
}

function Reader({ pageNumber, setPageNumber, bookmarks, setBookmarks, goHome }) {
  const [theme, setTheme] = useState("cream");
  const [zoom, setZoom] = useState("medium");
  const [spread, setSpread] = useState(false);
  const [locked, setLocked] = useState(false);
  const [extraLarge, setExtraLarge] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [audioStatus, setAudioStatus] = useState("Audio ready");
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [autoSpeed, setAutoSpeed] = useState("medium");
  const [autoRunning, setAutoRunning] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const audioRef = useRef(null);
  const page = pages[pageNumber - 1];
  const secondPage = spread && pageNumber < totalPages ? pages[pageNumber] : null;
  const progress = getProgress(pageNumber, totalPages);
  const results = useMemo(() => searchPages(pages, query), [query]);
  const navigate = (target) => setPageNumber(clampPage(target, totalPages));
  const step = spread && secondPage ? 2 : 1;
  const previousPage = () => navigate(pageNumber - step);
  const nextPage = () => navigate(pageNumber + step);

  useEffect(() => { saveLastPage(localStorage, pageNumber); }, [pageNumber]);
  useEffect(() => { pages.slice(pageNumber, pageNumber + 2).forEach((target) => { new Image().src = target.imageWebp; new Image().src = target.imageJpg; }); }, [pageNumber]);
  useEffect(() => { const onKey = (event) => { if (event.key === "ArrowLeft") previousPage(); if (event.key === "ArrowRight") nextPage(); if (event.key === "Escape") setContentsOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });
  useEffect(() => { if (!autoRunning) return undefined; const timer = setInterval(() => setPageNumber((current) => current >= totalPages ? current : current + 1), getAutoContinueDelay(autoSpeed)); return () => clearInterval(timer); }, [autoRunning, autoSpeed, setPageNumber]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => setOfflineReady(false)); }, []);

  const toggleBookmark = () => { const next = bookmarks.includes(pageNumber) ? removeBookmark(bookmarks, pageNumber) : addBookmark(bookmarks, pageNumber); setBookmarks(next); saveBookmarks(localStorage, next); };
  const playAudio = () => { if (!audioRef.current) return; audioRef.current.src = page.audio; audioRef.current.playbackRate = audioSpeed; audioRef.current.play().then(() => setAudioStatus("Audio playing")).catch(() => setAudioStatus("Audio is not available for this page yet.")); };
  const resetReader = () => { setTheme("cream"); setZoom("medium"); setSpread(false); setLocked(false); setExtraLarge(false); setAutoRunning(false); };
  const sharePage = async () => { const result = await copyShareText({ clipboard: navigator.clipboard, text: createShareText(window.location.origin, pageNumber) }); setShareMessage(result.ok ? "Page link copied." : `Copy this link: ${result.manualText}`); };

  return <main className={`reader-screen theme-${theme} ${extraLarge ? "extra-large-mode" : ""}`}><div className="reader-topbar"><button className="secondary-btn" onClick={goHome}>Home</button><button className="secondary-btn" onClick={() => setContentsOpen(true)}>Contents</button><div className="status-pill">{offlineReady ? "Available offline" : "Preparing offline"}</div></div><div className="progress-wrap" aria-label={`Reading progress ${progress}%`}><div style={{ width: `${progress}%` }} /></div><section className="reader-stage"><div className={`page-row ${spread ? "spread" : ""}`}><PageImage page={page} zoom={zoom} onTap={(event) => { if (locked) return; const rect = event.currentTarget.getBoundingClientRect(); event.clientX < rect.left + rect.width / 2 ? previousPage() : nextPage(); }} />{secondPage && <PageImage page={secondPage} zoom={zoom} onTap={() => !locked && nextPage()} />}</div></section><section className="reader-controls"><div className="nav-controls"><button className="primary-btn" onClick={previousPage}>Previous</button><div className="page-count">Page {pageNumber} of {totalPages}</div><button className="primary-btn" onClick={nextPage}>Next</button></div><div className="control-grid"><div className="control-group"><span>Zoom</span>{Object.entries(zoomLabels).map(([value, label]) => <button key={value} className={zoom === value ? "active" : ""} onClick={() => setZoom(value)}>{label}</button>)}</div><div className="control-group"><span>Comfort</span>{["cream", "dark", "contrast"].map((value) => <button key={value} className={theme === value ? "active" : ""} onClick={() => setTheme(value)}>{value === "contrast" ? "High Contrast" : value}</button>)}</div><div className="control-group"><span>Reading</span><button className={extraLarge ? "active" : ""} onClick={() => setExtraLarge(!extraLarge)}>Extra Large Reading Mode</button><button className={locked ? "active" : ""} onClick={() => setLocked(!locked)}>{locked ? "Unlock Taps" : "Lock Reading Mode"}</button><button className={spread ? "active" : ""} onClick={() => setSpread(!spread)}>Two-page Spread</button><button onClick={() => document.documentElement.requestFullscreen?.()}>Fullscreen Reading</button></div><div className="control-group"><span>Saved Pages</span><button className={bookmarks.includes(pageNumber) ? "active" : ""} onClick={toggleBookmark}>{bookmarks.includes(pageNumber) ? "Remove Bookmark" : "Bookmark Page"}</button>{bookmarks.map((saved) => <button key={saved} onClick={() => navigate(saved)}>Page {saved}</button>)}</div><div className="control-group"><span>Audio</span><div className="audio-status">{audioStatus}</div><button onClick={playAudio}>Play</button><button onClick={() => { audioRef.current?.pause(); setAudioStatus("Audio paused"); }}>Pause</button><button onClick={playAudio}>Resume</button>{[0.75, 1, 1.25].map((speed) => <button key={speed} className={audioSpeed === speed ? "active" : ""} onClick={() => setAudioSpeed(speed)}>{speed}x</button>)}</div><div className="control-group"><span>Auto Continue</span>{["slow", "medium", "fast"].map((speed) => <button key={speed} className={autoSpeed === speed ? "active" : ""} onClick={() => setAutoSpeed(speed)}>{speed}</button>)}<button className={autoRunning ? "active" : ""} onClick={() => setAutoRunning(true)}>Auto Continue</button><button onClick={() => setAutoRunning(false)}>Stop</button></div><div className="control-group"><span>Share and Download</span><button onClick={sharePage}>Share Current Page</button>{shareMessage && <div className="share-message">{shareMessage}</div>}<a className="download-link" href="/book.pdf" download>Download PDF</a><button onClick={resetReader}>Reset Reader</button></div></div></section><audio ref={audioRef} onError={() => setAudioStatus("Audio is not available for this page yet.")} /><ContentsPanel open={contentsOpen} query={query} setQuery={setQuery} results={results} jumpToPage={(target) => { navigate(target); setContentsOpen(false); }} close={() => setContentsOpen(false)} /></main>;
}

export default function App() {
  const initialPage = clampPage(new URLSearchParams(window.location.search).get("page") || loadLastPage(localStorage, totalPages), totalPages);
  const [screen, setScreen] = useState("home");
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks(localStorage));
  const goReader = (targetPage) => { setPageNumber(clampPage(targetPage, totalPages)); setScreen("reader"); };
  return screen === "home" ? <Home lastPage={loadLastPage(localStorage, totalPages)} bookmarks={bookmarks} goReader={goReader} /> : <Reader pageNumber={pageNumber} setPageNumber={setPageNumber} bookmarks={bookmarks} setBookmarks={setBookmarks} goHome={() => setScreen("home")} />;
}
