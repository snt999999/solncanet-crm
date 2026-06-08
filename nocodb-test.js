const NOCODB_ENDPOINT = process.env.NOCODB_ENDPOINT || "https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records";

exports.handler = async function(event) {
  if (event.httpMethod !== "GET") return send(405, { ok:false, error:"Only GET is allowed" });

  const auth = checkAdminPassword(event);
  if (!auth.ok) return send(auth.status, auth.body);

  const token = process.env.NOCODB_TOKEN;
  if (!token) return send(500, { ok:false, error:"NOCODB_TOKEN is missing" });

  try {
    const url = new URL(NOCODB_ENDPOINT);
    url.searchParams.set("limit", "200");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type":"application/json", "xc-token": token }
    });

    const text = await res.text();
    const data = parseJson(text);

    if (!res.ok) return send(500, { ok:false, error:"NocoDB list error", status:res.status, nocodbResponse:data });

    const rawRecords = Array.isArray(data) ? data : (data.records || data.list || []);
    const records = rawRecords.map(normalizeRecord);

    return send(200, { ok:true, count:records.length, records });
  } catch (error) {
    return send(500, { ok:false, error:error.message });
  }
};

function normalizeRecord(rec) {
  const fields = rec.fields || rec;
  const id = rec.id || (rec.id_fields && (rec.id_fields.Id || rec.id_fields.id)) || fields.Id || fields.id || "";
  return { id:String(id), id_fields: rec.id_fields || { Id: Number(id) || id }, fields };
}

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
