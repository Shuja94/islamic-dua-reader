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
} from "./utils/reader";

const totalPages = pages.length;

const zoomClasses = {
  small: "max-w-[760px]",
  medium: "max-w-[920px]",
  large: "max-w-[1080px]",
  xlarge: "max-w-[1240px]",
};

const zoomLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xlarge: "Extra Large",
};

function Icon({ name }) {
  const icons = {
    menu: "☰",
    bookmark: "★",
    close: "×",
    previous: "‹",
    next: "›",
    play: "▶",
    pause: "Ⅱ",
    stop: "■",
  };
  return <span aria-hidden="true">{icons[name]}</span>;
}

function PageImage({ page, zoom, onTap, hiddenLabel }) {
  const [source, setSource] = useState(page.imageWebp);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(page.imageWebp);
    setFailed(false);
  }, [page.page]);

  if (failed) {
    return (
      <div className="page-error" role="status">
        Page could not load. Please check internet or try again.
      </div>
    );
  }

  return (
    <button
      className={`page-shell ${zoomClasses[zoom]}`}
      type="button"
      onClick={onTap}
      aria-label={hiddenLabel}
    >
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

function Home({ lastPage, bookmarks, goReader, jumpToPage }) {
  return (
    <main className="home-screen">
      <section className="home-content" aria-labelledby="book-title">
        <div className="cover-frame">
          <img src="/cover.svg" alt="Book cover" />
        </div>

        <div className="home-copy">
          <p className="eyebrow">ދުޢާ ފޮތް</p>
          <h1 id="book-title">Islamic Dua Reader</h1>
          <p>
            A gentle page-image reader designed for Dhivehi and Arabic text, with large controls
            and comfortable reading modes.
          </p>

          <div className="home-actions">
            <button className="primary-btn" type="button" onClick={() => goReader(1)}>
              Start Reading
            </button>
            {lastPage > 1 && (
              <button className="secondary-btn" type="button" onClick={() => goReader(lastPage)}>
                Continue from Page {lastPage}
              </button>
            )}
          </div>

          {bookmarks.length > 0 && (
            <section className="saved-box" aria-labelledby="saved-pages-title">
              <h2 id="saved-pages-title">My Saved Pages</h2>
              <div className="saved-list">
                {bookmarks.map((page) => (
                  <button key={page} type="button" onClick={() => jumpToPage(page)}>
                    Page {page}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function ContentsPanel({ open, query, setQuery, results, jumpToPage, close }) {
  if (!open) return null;

  return (
    <aside className="contents-panel" aria-label="Table of contents">
      <div className="panel-head">
        <h2>Contents</h2>
        <button className="icon-btn" type="button" onClick={close} aria-label="Close contents">
          <Icon name="close" />
        </button>
      </div>

      <label className="search-label">
        Search page or dua title
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          inputMode="search"
          placeholder="Page number or category"
        />
      </label>

      <div className="category-list">
        {pageCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              const match = pages.find((page) => page.category === category);
              if (match) jumpToPage(match.page);
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="toc-results">
        {results.map((page) => (
          <button key={page.page} type="button" onClick={() => jumpToPage(page.page)}>
            <span>Page {page.page}</span>
            <strong>{page.title}</strong>
          </button>
        ))}
      </div>
    </aside>
  );
}

function Reader({
  pageNumber,
  setPageNumber,
  bookmarks,
  setBookmarks,
  goHome,
  lastPage,
}) {
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
  const bookmarked = bookmarks.includes(pageNumber);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter(
      (item) =>
        String(item.page) === term ||
        item.title.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    );
  }, [query]);

  const navigate = (nextPage) => {
    setPageNumber(clampPage(nextPage, totalPages));
  };

  const nextPage = () => navigate(pageNumber + (spread && secondPage ? 2 : 1));
  const previousPage = () => navigate(pageNumber - (spread ? 2 : 1));

  useEffect(() => {
    saveLastPage(localStorage, pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    const preloadTargets = pages.slice(pageNumber, pageNumber + 2);
    preloadTargets.forEach((target) => {
      const webp = new Image();
      webp.src = target.imageWebp;
      const jpg = new Image();
      jpg.src = target.imageJpg;
    });
  }, [pageNumber]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") previousPage();
      if (event.key === "ArrowRight") nextPage();
      if (event.key === "Escape") {
        setContentsOpen(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!autoRunning) return undefined;
    const timer = window.setInterval(() => {
      setPageNumber((current) => {
        if (current >= totalPages) {
          setAutoRunning(false);
          return current;
        }
        return current + 1;
      });
    }, getAutoContinueDelay(autoSpeed));
    return () => window.clearInterval(timer);
  }, [autoRunning, autoSpeed, setPageNumber]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then(() => setOfflineReady(true))
      .catch(() => setOfflineReady(false));
  }, []);

  const toggleBookmark = () => {
    const next = bookmarked
      ? removeBookmark(bookmarks, pageNumber)
      : addBookmark(bookmarks, pageNumber);
    setBookmarks(next);
    saveBookmarks(localStorage, next);
  };

  const playAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.src = page.audio;
    audioRef.current.playbackRate = audioSpeed;
    audioRef.current
      .play()
      .then(() => setAudioStatus("Audio playing"))
      .catch(() => setAudioStatus("Audio is not available for this page yet."));
  };

  const pauseAudio = () => {
    audioRef.current?.pause();
    setAudioStatus("Audio paused");
  };

  const resetReader = () => {
    setTheme("cream");
    setZoom("medium");
    setSpread(false);
    setLocked(false);
    setExtraLarge(false);
    setAutoRunning(false);
  };

  const sharePage = async () => {
    const text = createShareText(window.location.origin, pageNumber);
    const result = await copyShareText({ clipboard: navigator.clipboard, text });
    setShareMessage(result.ok ? "Page link copied." : `Copy this link: ${result.manualText}`);
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <main className={`reader-screen theme-${theme} ${extraLarge ? "extra-large-mode" : ""}`}>
      <div className="reader-topbar">
        <button className="secondary-btn" type="button" onClick={goHome}>
          Home
        </button>
        <button className="secondary-btn" type="button" onClick={() => setContentsOpen(true)}>
          <Icon name="menu" /> Contents
        </button>
        <div className="status-pill">{offlineReady ? "Available offline" : "Preparing offline"}</div>
      </div>

      <div className="progress-wrap" aria-label={`Reading progress ${progress}%`}>
        <div style={{ width: `${progress}%` }} />
      </div>

      <section className="reader-stage" aria-live="polite">
        {!locked && (
          <button className="tap-zone tap-prev" type="button" onClick={previousPage} aria-label="Previous page" />
        )}
        <div className={`page-row ${spread ? "spread" : ""}`}>
          <PageImage
            page={page}
            zoom={zoom}
            hiddenLabel="Open previous page by tapping left area"
            onTap={(event) => {
              if (locked) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const midpoint = rect.left + rect.width / 2;
              event.clientX < midpoint ? previousPage() : nextPage();
            }}
          />
          {secondPage && (
            <PageImage
              page={secondPage}
              zoom={zoom}
              hiddenLabel="Second page in desktop spread"
              onTap={() => {
                if (!locked) nextPage();
              }}
            />
          )}
        </div>
        {!locked && (
          <button className="tap-zone tap-next" type="button" onClick={nextPage} aria-label="Next page" />
        )}
      </section>

      <section className="reader-controls" aria-label="Reader controls">
        <div className="nav-controls">
          <button className="primary-btn" type="button" onClick={previousPage}>
            <Icon name="previous" /> Previous
          </button>
          <div className="page-count">
            Page {pageNumber} of {totalPages}
          </div>
          <button className="primary-btn" type="button" onClick={nextPage}>
            Next <Icon name="next" />
          </button>
        </div>

        <div className="control-grid">
          <div className="control-group">
            <span>Zoom</span>
            {Object.entries(zoomLabels).map(([value, label]) => (
              <button
                key={value}
                className={zoom === value ? "active" : ""}
                type="button"
                onClick={() => setZoom(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="control-group">
            <span>Comfort</span>
            {["cream", "dark", "contrast"].map((value) => (
              <button
                key={value}
                className={theme === value ? "active" : ""}
                type="button"
                onClick={() => setTheme(value)}
              >
                {value === "contrast" ? "High Contrast" : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="control-group">
            <span>Reading</span>
            <button type="button" className={extraLarge ? "active" : ""} onClick={() => setExtraLarge(!extraLarge)}>
              Extra Large Reading Mode
            </button>
            <button type="button" className={locked ? "active" : ""} onClick={() => setLocked(!locked)}>
              {locked ? "Unlock Taps" : "Lock Reading Mode"}
            </button>
            <button type="button" className={spread ? "active" : ""} onClick={() => setSpread(!spread)}>
              Two-page Spread
            </button>
            <button type="button" onClick={enterFullscreen}>
              Fullscreen Reading
            </button>
          </div>

          <div className="control-group">
            <span>Saved Pages</span>
            <button type="button" className={bookmarked ? "active" : ""} onClick={toggleBookmark}>
              <Icon name="bookmark" /> {bookmarked ? "Remove Bookmark" : "Bookmark Page"}
            </button>
            {bookmarks.map((saved) => (
              <button key={saved} type="button" onClick={() => navigate(saved)}>
                Page {saved}
              </button>
            ))}
          </div>

          <div className="control-group">
            <span>Audio</span>
            <div className="audio-status">{audioStatus}</div>
            <div className="button-line">
              <button type="button" onClick={playAudio}>
                <Icon name="play" /> Play
              </button>
              <button type="button" onClick={pauseAudio}>
                <Icon name="pause" /> Pause
              </button>
              <button type="button" onClick={playAudio}>
                Resume
              </button>
            </div>
            <div className="button-line">
              {[0.75, 1, 1.25].map((speed) => (
                <button
                  key={speed}
                  className={audioSpeed === speed ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setAudioSpeed(speed);
                    if (audioRef.current) audioRef.current.playbackRate = speed;
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <span>Auto Continue</span>
            <div className="button-line">
              {["slow", "medium", "fast"].map((speed) => (
                <button
                  key={speed}
                  className={autoSpeed === speed ? "active" : ""}
                  type="button"
                  onClick={() => setAutoSpeed(speed)}
                >
                  {speed[0].toUpperCase() + speed.slice(1)}
                </button>
              ))}
            </div>
            <div className="button-line">
              <button type="button" className={autoRunning ? "active" : ""} onClick={() => setAutoRunning(true)}>
                Auto Continue
              </button>
              <button type="button" onClick={() => setAutoRunning(false)}>
                <Icon name="stop" /> Stop
              </button>
            </div>
          </div>

          <div className="control-group">
            <span>Share and Download</span>
            <button type="button" onClick={sharePage}>
              Share Current Page
            </button>
            {shareMessage && <div className="share-message">{shareMessage}</div>}
            <a className="download-link" href="/book.pdf" download>
              Download PDF
            </a>
            <button type="button" onClick={resetReader}>
              Reset Reader
            </button>
          </div>
        </div>
      </section>

      <audio
        ref={audioRef}
        onError={() => setAudioStatus("Audio is not available for this page yet.")}
        onEnded={() => setAudioStatus("Audio finished")}
      />

      <ContentsPanel
        open={contentsOpen}
        query={query}
        setQuery={setQuery}
        results={results}
        jumpToPage={(target) => {
          navigate(target);
          setContentsOpen(false);
        }}
        close={() => setContentsOpen(false)}
      />
    </main>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const initialPage = clampPage(params.get("page") || loadLastPage(localStorage, totalPages), totalPages);
  const [screen, setScreen] = useState("home");
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [lastPage, setLastPage] = useState(loadLastPage(localStorage, totalPages));
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks(localStorage));

  useEffect(() => {
    setLastPage(loadLastPage(localStorage, totalPages));
  }, [pageNumber]);

  const goReader = (targetPage) => {
    const next = clampPage(targetPage, totalPages);
    setPageNumber(next);
    setScreen("reader");
  };

  if (screen === "home") {
    return (
      <Home
        lastPage={lastPage}
        bookmarks={bookmarks}
        goReader={goReader}
        jumpToPage={(page) => goReader(page)}
      />
    );
  }

  return (
    <Reader
      pageNumber={pageNumber}
      setPageNumber={setPageNumber}
      bookmarks={bookmarks}
      setBookmarks={setBookmarks}
      lastPage={lastPage}
      goHome={() => setScreen("home")}
    />
  );
}
