const NOCODB_ENDPOINT = process.env.NOCODB_ENDPOINT || "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return send(405, { ok:false, error:"Only POST is allowed" });

  const auth = checkAdminPassword(event);
  if (!auth.ok) return send(auth.status, auth.body);

  const token = process.env.NOCODB_TOKEN;
  if (!token) return send(500, { ok:false, error:"NOCODB_TOKEN is missing" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch(error) { return send(400, { ok:false, error:"Invalid JSON" }); }

  const id = body.id;
  if (!id) return send(400, { ok:false, error:"Record id is required" });

  const allowed = ["Статус","Итоговый м2","Ответственный","Комментарий администратора","Создан объект","Монтажник 1","Монтажник 2","Монтажник 3","Монтажник 4"];
  const fields = {};
  for (const key of allowed) {
    if (body.fields && Object.prototype.hasOwnProperty.call(body.fields, key)) fields[key] = body.fields[key];
  }

  const payload = [{ id_fields: { Id: Number(id) || id }, fields }];

  try {
    const res = await fetch(NOCODB_ENDPOINT, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "xc-token": token },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    const data = parseJson(text);

    if (!res.ok) return send(500, { ok:false, error:"NocoDB update error", status:res.status, nocodbResponse:data, sentPayload:payload });

    return send(200, { ok:true, updated:true, nocodbResponse:data });
  } catch(error) {
    return send(500, { ok:false, error:error.message });
  }
};

function checkAdminPassword(event) {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) return { ok:false, status:500, body:{ ok:false, error:"ADMIN_PASSWORD is not set in Netlify environment variables" } };
  const provided = (event.headers["x-admin-password"] || event.headers["X-Admin-Password"] || "").trim();
  if (provided !== required) return { ok:false, status:401, body:{ ok:false, error:"Неверный пароль администратора" } };
  return { ok:true };
}

function parseJson(text) { try { return JSON.parse(text); } catch(e) { return text; } }
function send(statusCode, body) {
  return { statusCode, headers:{ "Content-Type":"application/json; charset=utf-8" }, body:JSON.stringify(body,null,2) };
}
