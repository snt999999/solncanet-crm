// SOLNCANET: direct NocoDB test function
// URL:
// https://solncanet-crm.netlify.app/.netlify/functions/nocodb-test
//
// Version v6: NocoDB v3 body fixed.
// NocoDB expects: [{ fields: {...} }]

const NOCODB_ENDPOINT = process.env.NOCODB_ENDPOINT || "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  const token = process.env.NOCODB_TOKEN;

  if (!token) {
    return send(500, {
      ok: false,
      error: "NOCODB_TOKEN отсутствует"
    });
  }

  const testRecord = {
    "Дата создания": new Date().toISOString(),
    "Имя клиента": "ТЕСТ NETLIFY",
    "Телефон": "+79999999999",
    "Услуга": "Проверка связи Netlify → NocoDB",
    "Дата записи": "2026-06-05",
    "Время записи": "12:00",
    "Адрес": "Тестовый адрес",
    "м2": 10,
    "Комментарий": "Если эта строка появилась, связь с NocoDB работает",
    "Статус": "Новая заявка",
    "Cal Booking ID": "manual-test-" + Date.now()
  };

  try {
    const response = await fetch(NOCODB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xc-token": token
      },
      body: JSON.stringify([{ fields: testRecord }])
    });

    const text = await response.text();

    return send(response.ok ? 200 : 500, {
      ok: response.ok,
      status: response.status,
      sentRecord: testRecord,
      nocodbResponse: parseJson(text)
    });

  } catch (error) {
    return send(500, {
      ok: false,
      error: error.message,
      sentRecord: testRecord
    });
  }
};

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function send(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body, null, 2)
  };
}
