СОЛНЦАНЕТ — v2 debug Cal.com → Netlify Function → NocoDB

Что исправлено:
1. GET-запрос к функции теперь показывает статус, чтобы легко проверить, что функция реально развернулась.
2. Для NocoDB v3 запись отправляется массивом: [record].
3. Ошибки возвращаются подробно.

Проверка после загрузки:
Откройте в браузере:
https://ВАШ-САЙТ.netlify.app/.netlify/functions/cal-to-nocodb

Должно быть:
{
  "ok": true,
  "service": "SOLNCANET Cal.com -> NocoDB webhook",
  "hasNocodbToken": true
}

Если hasNocodbToken false — переменная NOCODB_TOKEN не добавлена или после добавления не сделан redeploy.

Webhook в Cal.com:
URL:
https://ВАШ-САЙТ.netlify.app/.netlify/functions/cal-to-nocodb

Оставить только trigger:
Booking Created / Бронирование создано

NocoDB endpoint:
https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records
