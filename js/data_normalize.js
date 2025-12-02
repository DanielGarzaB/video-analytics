import { parseDurationText, parseMetricValue } from "./utils_parsers.js";

const INVALID_VALUE_TOKENS = new Set(["--", "-", "n/a", "na", "null", "undefined"]);

const NORMALIZE_KNOWN_KEYS = new Set([
  "Views_num",
  "views_num",
  "viewsNum",
  "Views",
  "views",
  "Views ",
  "Total_Engagements",
  "total_engagements",
  "Likes",
  "likes",
  "Comments",
  "comments",
  "Shares",
  "shares",
  "Compartidos",
  "Published_Date",
  "Published Date",
  "Published",
  "upload_date",
  "Upload Date",
  "Date",
  "Fecha",
  "Video_URL",
  "Video URL",
  "video_url",
  "Video Link",
  "Link",
  "Enlace",
  "URL",
  "image_url",
  "Image_URL",
  "Thumbnail",
  "thumbnail",
  "Thumb",
  "thumb",
  "Imagen",
  "Imagen_URL",
  "platform",
  "Platform",
  "Plataforma",
  "Origen",
  "Creator",
  "creator",
  "Creador",
  "creador",
  "creator_name",
  "Creator Name",
  "Video_Title",
  "Video Title",
  "video",
  "Video",
  "Title",
  "Titulo",
  "V30",
  "v30",
  "V30_num",
  "v30_num",
  "Duration (seconds)",
  "Duration_seconds",
  "duration_sec",
  "durationSeconds",
  "Duration",
  "duration",
]);

export function pickValue(row, keys = []) {
  if (!row || !Array.isArray(keys)) return undefined;
  for (const rawKey of keys) {
    if (!rawKey) continue;
    if (!Object.prototype.hasOwnProperty.call(row, rawKey)) continue;
    const value = row[rawKey];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (INVALID_VALUE_TOKENS.has(trimmed.toLowerCase())) continue;
      return trimmed;
    }
    return value;
  }
  return undefined;
}

export function normalizeRows(data = []) {
  if (data.length > 0) {
    const unknownKeys = Object.keys(data[0]).filter(
      (key) => !NORMALIZE_KNOWN_KEYS.has(key) && !key.startsWith("__"),
    );
    if (unknownKeys.length) {
      console.warn("[normalizeRows] Columnas no reconocidas:", unknownKeys);
    }
  }

  return data
    .map((row) => {
      const views = parseMetricValue(
        pickValue(row, [
          "Views_num",
          "views_num",
          "viewsNum",
          "Views",
          "views",
          "Views ",
        ]),
      );

      let eng = parseMetricValue(
        pickValue(row, ["Total_Engagements", "total_engagements"]),
      );
      if (!eng) {
        const likes = parseMetricValue(pickValue(row, ["Likes", "likes"]));
        const comments = parseMetricValue(
          pickValue(row, ["Comments", "comments"]),
        );
        const shares = parseMetricValue(
          pickValue(row, ["Shares", "shares", "Compartidos"]),
        );
        eng = likes + comments + shares;
      }

      const er = views > 0 ? (eng / views) * 100 : 0;
      const dateStr =
        pickValue(row, [
          "Published_Date",
          "Published Date",
          "Published",
          "upload_date",
          "Upload Date",
          "Date",
          "Fecha",
        ]) || "";
      const date = new Date(dateStr);
      const url =
        pickValue(row, [
          "Video_URL",
          "Video URL",
          "video_url",
          "Video Link",
          "Link",
          "Enlace",
          "URL",
        ]) || "#";
      const thumb =
        pickValue(row, [
          "image_url",
          "Image_URL",
          "Thumbnail",
          "thumbnail",
          "Thumb",
          "thumb",
          "Imagen",
          "Imagen_URL",
        ]) || "";
      const platform =
        pickValue(row, ["platform", "Platform", "Plataforma", "Origen"]) || "";
      const creatorFromFile = row.__creatorFallback || "";
      const rawCreator =
        pickValue(row, [
          "Creator",
          "creator",
          "Creador",
          "creador",
          "creator_name",
          "Creator Name",
        ]) || "";
      const creator =
        rawCreator && String(rawCreator).trim()
          ? String(rawCreator).trim()
          : creatorFromFile || "Desconocido";

      return {
        title:
          pickValue(row, [
            "Video_Title",
            "Video Title",
            "video",
            "Video",
            "Title",
            "Titulo",
          ]) || "Sin Titulo",
        url,
        date,
        views,
        v30: parseMetricValue(
          pickValue(row, ["V30", "v30", "V30_num", "v30_num"]),
        ),
        dur: (() => {
          const durationSeconds = parseMetricValue(
            pickValue(row, [
              "Duration (seconds)",
              "Duration_seconds",
              "duration_sec",
              "durationSeconds",
            ]),
          );
          if (durationSeconds) return durationSeconds;
          const durText = pickValue(row, ["Duration", "duration"]);
          if (durText) return parseDurationText(durText);
          return 0;
        })(),
        er,
        creator,
        thumb,
        platform,
      };
    })
    .filter((dataPoint) => !Number.isNaN(dataPoint.date.getTime()));
}

export function normalizeDateLocal(dateObj) {
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function localKey(dateObj) {
  const d = normalizeDateLocal(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getSortValue(key, period) {
  if (period === "day" || period === "week") return new Date(key).getTime();
  if (period === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month || 0, 1).getTime();
  }
  if (period === "quarter") {
    const [yearStr, quarterStr] = key.split("-Q");
    const quarter = Number(quarterStr) || 1;
    const month = (quarter - 1) * 3;
    return new Date(Number(yearStr), month, 1).getTime();
  }
  return 0;
}

export function groupData(data, period) {
  const groups = {};
  data.forEach((dataPoint) => {
    let key;
    let label;
    if (period === "day") {
      const dayDate = normalizeDateLocal(dataPoint.date);
      key = localKey(dayDate);
      label = dayDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } else if (period === "week") {
      const monday = normalizeDateLocal(dataPoint.date);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
      key = localKey(monday);
      label = monday.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } else if (period === "month") {
      const dt = normalizeDateLocal(dataPoint.date);
      key = `${dt.getFullYear()}-${dt.getMonth()}`;
      label = dt.toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });
    } else if (period === "quarter") {
      const dt = normalizeDateLocal(dataPoint.date);
      const quarter = Math.floor(dt.getMonth() / 3) + 1;
      key = `${dt.getFullYear()}-Q${quarter}`;
      label = `Q${quarter} ${dt.getFullYear().toString().substring(2)}`;
    }
    if (!groups[key]) {
      groups[key] = { label, count: 0, vSum: 0, v30Sum: 0, durSum: 0 };
    }
    groups[key].count += 1;
    groups[key].vSum += dataPoint.views;
    groups[key].v30Sum += dataPoint.v30;
    groups[key].durSum += dataPoint.dur;
  });
  return groups;
}
