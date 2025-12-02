import {
  fmtDateShort,
  fmtViews,
  fmtDur,
  escapeHtml,
} from "./utils_formatters.js";

const appConfig = typeof window !== "undefined" ? window.CONFIG || {} : {};
const appState = typeof window !== "undefined" ? window.State : null;

const THUMB_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
let thumbObserver = null;
let thumbObserverRoot = null;

const PLATFORM_META = {
  facebook: {
    label: "Facebook",
    className: "platform-chip--facebook",
    iconClass: "fa-brands fa-facebook",
  },
  tiktok: {
    label: "TikTok",
    className: "platform-chip--tiktok",
    iconClass: "fa-brands fa-tiktok",
  },
  instagram: {
    label: "Instagram",
    className: "platform-chip--instagram",
    iconClass: "fa-brands fa-instagram",
  },
  youtube: {
    label: "YouTube",
    className: "platform-chip--youtube",
    iconClass: "fa-brands fa-youtube",
  },
};

const byId = (id) =>
  typeof document !== "undefined" ? document.getElementById(id) : null;

export function resetThumbObserver() {
  if (thumbObserver) thumbObserver.disconnect();
  thumbObserver = null;
  thumbObserverRoot = null;
}

export function loadThumbImage(imgEl) {
  if (!imgEl) return;
  const realSrc = imgEl.dataset.thumbSrc;
  if (!realSrc) return;
  imgEl.src = realSrc;
  imgEl.dataset.thumbLoaded = "1";
  if (thumbObserver) thumbObserver.unobserve(imgEl);
}

export function ensureThumbObserver(rootEl) {
  if (typeof window === "undefined" || !("IntersectionObserver" in window))
    return null;
  if (thumbObserver && thumbObserverRoot === rootEl) return thumbObserver;
  resetThumbObserver();
  thumbObserverRoot = rootEl || null;
  thumbObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          loadThumbImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: thumbObserverRoot,
      rootMargin: "48px 0px",
      threshold: 0.01,
    },
  );
  return thumbObserver;
}

export function hydrateLazyThumbs(tbody) {
  if (!tbody) return;
  const lazyImgs = tbody.querySelectorAll("img[data-thumb-src]");
  if (!lazyImgs.length) return;
  const scrollContainer = tbody.closest(".table-shell");
  const observer = ensureThumbObserver(scrollContainer);
  lazyImgs.forEach((imgEl) => {
    if (imgEl.dataset.thumbLoaded === "1") return;
    if (observer) {
      observer.observe(imgEl);
    } else {
      loadThumbImage(imgEl);
    }
  });
}

export function forceLoadAllThumbs() {
  const imgs = Array.from(document.querySelectorAll("img[data-thumb-src]"));
  if (!imgs.length) return Promise.resolve();
  return Promise.race([
    Promise.all(
      imgs.map(
        (imgEl) =>
          new Promise((resolve) => {
            if (imgEl.complete && imgEl.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => {
              imgEl.removeEventListener("load", done);
              imgEl.removeEventListener("error", done);
              resolve();
            };
            imgEl.addEventListener("load", done, { once: true });
            imgEl.addEventListener("error", done, { once: true });
            loadThumbImage(imgEl);
          }),
      ),
    ),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]);
}

export function renderPlatformBadge(platformRaw) {
  const key = String(platformRaw || "").trim().toLowerCase();
  const meta =
    PLATFORM_META[key] || {
      label: platformRaw ? String(platformRaw).trim() : "Otro",
      className: "platform-chip--default",
      iconClass: "fa-solid fa-video",
    };
  const label = escapeHtml(meta.label || "Otro");
  const classes = [
    "platform-chip",
    "platform-chip--static",
    "is-active",
    meta.className || "platform-chip--default",
  ]
    .filter(Boolean)
    .join(" ");
  const iconHtml = meta.iconClass
    ? `<i class="${meta.iconClass}" aria-hidden="true"></i>`
    : "";
  return `<span class="${classes}" title="${label}">${iconHtml}<span>${label}</span></span>`;
}

export function renderTopVideos() {
  if (!appState) return;
  const filteredData = appState.getFilteredData();
  const limit = appConfig.TOP_VIDEOS_LIMIT ?? filteredData.length;
  const sorted = [...filteredData]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
  const tbody = byId("topVideosBody");
  if (!tbody) return;
  resetThumbObserver();
  const rows = sorted
    .map(
      (dataPoint, index) => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 text-center text-slate-500 font-semibold">${index + 1}</td>
          <td class="p-3 text-center text-slate-500 whitespace-nowrap">${fmtDateShort(dataPoint.date)}</td>
          <td class="p-3 text-right font-bold text-primary">${fmtViews(dataPoint.views)}</td>
          <td class="p-3 text-right text-slate-600 font-medium">${fmtViews(dataPoint.v30)}</td>
          <td class="p-3 text-center text-slate-500 whitespace-nowrap">${fmtDur(dataPoint.dur)}</td>
          <td class="p-3 text-slate-700 font-medium align-top max-w-[760px]">
            <a href="${dataPoint.url}" target="_blank" class="video-link video-entry">
              <div class="video-thumb${dataPoint.thumb ? "" : " video-thumb--empty"}">
                ${
                  dataPoint.thumb
                    ? `<img src="${THUMB_PLACEHOLDER}" data-thumb-src="${escapeHtml(
                        dataPoint.thumb,
                      )}" alt="Miniatura de ${escapeHtml(
                        dataPoint.title,
                      )}" loading="lazy" decoding="async" />`
                    : '<span class="video-thumb__placeholder">Sin imagen</span>'
                }
              </div>
              <div class="video-meta">
                <div class="video-title" title="${escapeHtml(dataPoint.title)}">
                  ${escapeHtml(dataPoint.title)} <i class="fa-solid fa-external-link-alt text-[10px] opacity-60 align-middle ml-1"></i>
                </div>
                <div class="video-creator">by ${escapeHtml(dataPoint.creator)}</div>
              </div>
            </a>
          </td>
          <td class="p-3 text-center">${renderPlatformBadge(dataPoint.platform)}</td>
        </tr>`,
    )
    .join("");
  tbody.innerHTML = rows;
  hydrateLazyThumbs(tbody);
}
