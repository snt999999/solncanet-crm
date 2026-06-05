exports.handler = async function(event) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      ok: true,
      message: "Netlify Functions работают"
    })
  };
};
