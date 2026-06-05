// SOLNCANET: Cal.com webhook -> NocoDB
// NEW FUNCTION NAME: cal-nocodb-v5
// URL:
// https://YOUR-SITE.netlify.app/.netlify/functions/cal-nocodb-v5

const DEFAULT_NOCODB_ENDPOINT = "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  if (event.httpMethod === "GET") {
    return send(200, {
      ok: true,
      version: "v5",
      service: "SOLNCANET Cal.com to NocoDB",
      hasNocodbToken: Boolean(process.env.NOCODB_TOKEN),
      endpoint: process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT
    });
  }

  if (event.httpMethod !== "POST") {
    return send(405, { ok: false, error: "Only POST is allowed" });
  }

  const token = process.env.NOCODB_TOKEN;
  const endpoint = process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT;

  if (!token) {
    return send(500, {
      ok: false,
      error: "NOCODB_TOKEN is missing in Netlify environment variables"
    });
  }

  let incoming;
  try {
    incoming = JSON.parse(event.body || "{}");
  } catch (error) {
    return send(400, {
      ok: false,
      error: "Invalid JSON",
      bodyStart: String(event.body || "").slice(0, 300)
    });
  }

  const payload = incoming.payload || incoming;
  const responses = payload.responses || payload.bookingFieldsResponses || payload.metadata || {};
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const attendee = attendees.length ? attendees[0] : {};

  const startRaw = payload.startTime || payload.start || payload.start_time || "";
  const startDate = startRaw ? new Date(startRaw) : null;

  const record = {
    "Дата создания": new Date().toISOString(),
    "Имя клиента": String(findAnswer(responses, ["имя", "name", "фио"]) || attendee.name || payload.name || ""),
    "Телефон": String(findAnswer(responses, ["телефон", "phone", "номер"]) || attendee.phoneNumber || attendee.phone || ""),
    "Услуга": String((payload.eventType && payload.eventType.title) || payload.eventTitle || payload.title || "Онлайн-запись Cal.com"),
    "Дата записи": validDate(startDate) ? dateRu(startDate) : "",
    "Время записи": validDate(startDate) ? timeRu(startDate) : "",
    "Адрес": String(findAnswer(responses, ["адрес", "адрес объекта", "address", "location"]) || locationText(payload.location) || ""),
    "м2": areaNumber(findAnswer(responses, ["м2", "м²", "площадь", "area"])),
    "Комментарий": String(findAnswer(responses, ["комментарий", "comment", "описание", "что нужно сделать"]) || payload.description || ""),
    "Статус": "Новая заявка",
    "Cal Booking ID": String(payload.uid || payload.id || payload.bookingId || incoming.id || "")
  };

  try {
    const nc = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xc-token": token
      },
      body: JSON.stringify([record])
    });

    const text = await nc.text();

    if (!nc.ok) {
      return send(500, {
        ok: false,
        error: "NocoDB error",
        status: nc.status,
        nocodbResponse: text,
        record: record
      });
    }

    return send(200, {
      ok: true,
      version: "v5",
      message: "Saved to NocoDB",
      record: record,
      nocodbResponse: parse(text)
    });

  } catch (error) {
    return send(500, {
      ok: false,
      error: error.message,
      record: record
    });
  }
};

function findAnswer(obj, names) {
  if (!obj || typeof obj !== "object") return "";
  const wanted = names.map(norm);

  for (const key of Object.keys(obj)) {
    const raw = obj[key];
    const keyNorm = norm(key);

    let labelNorm = "";
    if (raw && typeof raw === "object") {
      labelNorm = norm(raw.label || raw.question || raw.name || raw.title || "");
    }

    for (const name of wanted) {
      if (keyNorm.includes(name) || labelNorm.includes(name)) {
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
    return Array.isArray(value.value) ? value.value.join(", ") : value.value;
  }
  if (Object.prototype.hasOwnProperty.call(value, "response")) return value.response;
  if (Object.prototype.hasOwnProperty.call(value, "answer")) return value.answer;
  if (Object.prototype.hasOwnProperty.call(value, "label")) return value.label;
  return JSON.stringify(value);
}

function locationText(location) {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    return location.address || location.location || location.value || JSON.stringify(location);
  }
  return "";
}

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function areaNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const cleaned = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : "";
}

function validDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function dateRu(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yekaterinburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return (
    parts.find(p => p.type === "year").value + "-" +
    parts.find(p => p.type === "month").value + "-" +
    parts.find(p => p.type === "day").value
  );
}

function timeRu(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Yekaterinburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function parse(text) {
  try { return JSON.parse(text); } catch (e) { return text; }
}

function send(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body, null, 2)
  };
}
