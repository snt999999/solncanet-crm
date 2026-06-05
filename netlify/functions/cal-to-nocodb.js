// Netlify Function: Cal.com webhook -> NocoDB
// URL after deploy:
// https://YOUR-SITE.netlify.app/.netlify/functions/cal-to-nocodb
//
// Version: v2 debug
// Changes:
// - GET request now returns a health-check JSON.
// - NocoDB v3 create-record endpoint receives an ARRAY of records: [record].
// - Error response includes detailed information for troubleshooting.

const DEFAULT_NOCODB_ENDPOINT = "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  if (event.httpMethod === "GET") {
    return json(200, {
      ok: true,
      service: "SOLNCANET Cal.com -> NocoDB webhook",
      message: "Function is deployed. Send POST webhook from Cal.com.",
      hasNocodbToken: Boolean(process.env.NOCODB_TOKEN),
      endpoint: process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed", method: event.httpMethod });
  }

  const nocodbEndpoint = process.env.NOCODB_ENDPOINT || DEFAULT_NOCODB_ENDPOINT;
  const nocodbToken = process.env.NOCODB_TOKEN;

  if (!nocodbToken) {
    return json(500, {
      ok: false,
      error: "NOCODB_TOKEN is not set in Netlify environment variables"
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, {
      ok: false,
      error: "Invalid JSON body",
      rawBodyStart: String(event.body || "").slice(0, 300)
    });
  }

  try {
    const payload = body.payload || body;

    const startRaw = payload.startTime || payload.start || payload.start_time || payload.startDate || "";
    const startDate = startRaw ? new Date(startRaw) : null;

    const responses = payload.responses || payload.bookingFieldsResponses || payload.metadata || {};
    const attendees = payload.attendees || [];
    const firstAttendee = Array.isArray(attendees) && attendees.length ? attendees[0] : {};

    const customerName =
      valueFromResponses(responses, ["name", "имя", "фио", "клиент"]) ||
      firstAttendee.name ||
      payload.name ||
      payload.attendeeName ||
      "";

    const phone =
      valueFromResponses(responses, ["phone", "телефон", "номер"]) ||
      firstAttendee.phoneNumber ||
      firstAttendee.phone ||
      "";

    const address =
      valueFromResponses(responses, ["address", "адрес", "адрес объекта", "location", "место"]) ||
      unwrapLocation(payload.location) ||
      "";

    const area =
      valueFromResponses(responses, ["м2", "м²", "площадь", "площадь м2", "примерный объем м2", "примерный объём м²", "area"]) ||
      "";

    const comment =
      valueFromResponses(responses, ["comment", "комментарий", "примечание", "что нужно сделать", "описание"]) ||
      payload.description ||
      "";

    const service =
      payload.eventType?.title ||
      payload.eventTitle ||
      payload.title ||
      payload.type ||
      payload.eventTypeSlug ||
      "Онлайн-запись Cal.com";

    const bookingId =
      payload.uid ||
      payload.id ||
      payload.bookingId ||
      body.id ||
      "";

    const record = {
      "Дата создания": new Date().toISOString(),
      "Имя клиента": String(customerName || ""),
      "Телефон": String(phone || ""),
      "Услуга": String(service || ""),
      "Дата записи": startDate && !Number.isNaN(startDate.getTime()) ? formatDateYekaterinburg(startDate) : "",
      "Время записи": startDate && !Number.isNaN(startDate.getTime()) ? formatTimeYekaterinburg(startDate) : "",
      "Адрес": String(address || ""),
      "м2": parseArea(area),
      "Комментарий": String(comment || ""),
      "Статус": "Новая заявка",
      "Cal Booking ID": String(bookingId || "")
    };

    const requestBody = JSON.stringify([record]);

    const response = await fetch(nocodbEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xc-token": nocodbToken
      },
      body: requestBody
    });

    const responseText = await response.text();

    if (!response.ok) {
      return json(500, {
        ok: false,
        error: "NocoDB request failed",
        status: response.status,
        nocodbResponse: responseText,
        record
      });
    }

    return json(200, {
      ok: true,
      message: "Booking saved to NocoDB",
      record,
      nocodb: safeJson(responseText)
    });

  } catch (error) {
    return json(500, {
      ok: false,
      error: error.message,
      stack: error.stack
    });
  }
};

function valueFromResponses(responses, names) {
  if (!responses || typeof responses !== "object") return "";
  const normalizedNames = names.map(normalize);

  for (const [key, rawValue] of Object.entries(responses)) {
    const normalizedKey = normalize(key);
    const label =
      rawValue && typeof rawValue === "object"
        ? normalize(rawValue.label || rawValue.question || rawValue.name || rawValue.title || "")
        : "";

    if (normalizedNames.includes(normalizedKey) || normalizedNames.includes(label)) {
      return unwrapValue(rawValue);
    }

    if (normalizedNames.some(n => normalizedKey.includes(n) || (label && label.includes(n)))) {
      return unwrapValue(rawValue);
    }
  }
  return "";
}

function unwrapValue(rawValue) {
  if (rawValue == null) return "";
  if (typeof rawValue !== "object") return rawValue;
  if (Array.isArray(rawValue)) return rawValue.join(", ");
  if ("value" in rawValue) {
    if (Array.isArray(rawValue.value)) return rawValue.value.join(", ");
    return rawValue.value;
  }
  if ("response" in rawValue) return rawValue.response;
  if ("answer" in rawValue) return rawValue.answer;
  if ("label" in rawValue && "value" not in rawValue) return rawValue.label;
  return JSON.stringify(rawValue);
}

function unwrapLocation(location) {
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
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ")
    .trim();
}

function parseArea(value) {
  if (value === "" || value == null) return "";
  const cleaned = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : "";
}

function formatDateYekaterinburg(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yekaterinburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function formatTimeYekaterinburg(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Yekaterinburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function safeJson(text) {
  try { return JSON.parse(text); } catch (_) { return text; }
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data, null, 2)
  };
}
