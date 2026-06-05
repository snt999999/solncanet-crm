// SOLNCANET: Cal.com webhook -> NocoDB
// Netlify Function URL:
// https://YOUR-SITE.netlify.app/.netlify/functions/cal-to-nocodb
//
// Version v4: clean syntax, no "not in", simple diagnostics.

const DEFAULT_NOCODB_ENDPOINT = "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  if (event.httpMethod === "GET") {
    return response(200, {
      ok: true,
      service: "SOLNCANET Cal.com -> NocoDB webhook",
      version: "v4",
      hasNocodbToken: !!process.env.NOCODB_TOKEN,
      endpoint: process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT
    });
  }

  if (event.httpMethod !== "POST") {
    return response(405, {
      ok: false,
      error: "Only POST is allowed"
    });
  }

  const token = process.env.NOCODB_TOKEN;
  const endpoint = process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT;

  if (!token) {
    return response(500, {
      ok: false,
      error: "NOCODB_TOKEN is missing in Netlify environment variables"
    });
  }

  let incoming;
  try {
    incoming = JSON.parse(event.body || "{}");
  } catch (e) {
    return response(400, {
      ok: false,
      error: "Webhook body is not valid JSON",
      raw: String(event.body || "").slice(0, 500)
    });
  }

  const payload = incoming.payload || incoming;

  const startRaw = payload.startTime || payload.start || payload.start_time || "";
  const startDate = startRaw ? new Date(startRaw) : null;

  const responses = payload.responses || payload.bookingFieldsResponses || payload.metadata || {};
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const attendee = attendees.length > 0 ? attendees[0] : {};

  const name =
    findAnswer(responses, ["имя", "name", "фио", "клиент"]) ||
    attendee.name ||
    payload.name ||
    "";

  const phone =
    findAnswer(responses, ["телефон", "phone", "номер"]) ||
    attendee.phoneNumber ||
    attendee.phone ||
    "";

  const address =
    findAnswer(responses, ["адрес", "адрес объекта", "address", "location"]) ||
    getLocation(payload.location) ||
    "";

  const area =
    findAnswer(responses, ["м2", "м²", "площадь", "area", "примерный объем", "примерный объём"]) ||
    "";

  const comment =
    findAnswer(responses, ["комментарий", "comment", "описание", "что нужно сделать"]) ||
    payload.description ||
    "";

  const service =
    (payload.eventType && payload.eventType.title) ||
    payload.eventTitle ||
    payload.title ||
    payload.type ||
    "Онлайн-запись Cal.com";

  const bookingId =
    payload.uid ||
    payload.id ||
    payload.bookingId ||
    incoming.id ||
    "";

  const record = {
    "Дата создания": new Date().toISOString(),
    "Имя клиента": String(name || ""),
    "Телефон": String(phone || ""),
    "Услуга": String(service || ""),
    "Дата записи": isValidDate(startDate) ? formatDate(startDate) : "",
    "Время записи": isValidDate(startDate) ? formatTime(startDate) : "",
    "Адрес": String(address || ""),
    "м2": parseArea(area),
    "Комментарий": String(comment || ""),
    "Статус": "Новая заявка",
    "Cal Booking ID": String(bookingId || "")
  };

  try {
    const ncResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xc-token": token
      },
      body: JSON.stringify([record])
    });

    const ncText = await ncResponse.text();

    if (!ncResponse.ok) {
      return response(500, {
        ok: false,
        error: "NocoDB returned an error",
        status: ncResponse.status,
        nocodbResponse: ncText,
        sentRecord: record
      });
    }

    return response(200, {
      ok: true,
      message: "Saved to NocoDB",
      sentRecord: record,
      nocodbResponse: tryParseJson(ncText)
    });

  } catch (e) {
    return response(500, {
      ok: false,
      error: e.message,
      sentRecord: record
    });
  }
};

function findAnswer(obj, names) {
  if (!obj || typeof obj !== "object") return "";

  const wanted = names.map(normalize);

  for (const key of Object.keys(obj)) {
    const raw = obj[key];
    const keyNorm = normalize(key);

    let labelNorm = "";
    if (raw && typeof raw === "object") {
      labelNorm = normalize(raw.label || raw.question || raw.name || raw.title || "");
    }

    for (const name of wanted) {
      if (keyNorm === name || labelNorm === name || keyNorm.indexOf(name) !== -1 || labelNorm.indexOf(name) !== -1) {
        return unwrap(raw);
      }
    }
  }

  return "";
}

function unwrap(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (Object.prototype.hasOwnProperty.call(value, "value")) {
    if (Array.isArray(value.value)) return value.value.join(", ");
    return value.value;
  }
  if (Object.prototype.hasOwnProperty.call(value, "response")) return value.response;
  if (Object.prototype.hasOwnProperty.call(value, "answer")) return value.answer;
  if (Object.prototype.hasOwnProperty.call(value, "label")) return value.label;
  return JSON.stringify(value);
}

function getLocation(location) {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    return location.address || location.location || location.value || JSON.stringify(location);
  }
  return "";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function parseArea(value) {
  if (value === "" || value === null || value === undefined) return "";
  const cleaned = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : "";
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yekaterinburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const y = parts.find(function(p) { return p.type === "year"; }).value;
  const m = parts.find(function(p) { return p.type === "month"; }).value;
  const d = parts.find(function(p) { return p.type === "day"; }).value;

  return y + "-" + m + "-" + d;
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Yekaterinburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

function response(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body, null, 2)
  };
}
