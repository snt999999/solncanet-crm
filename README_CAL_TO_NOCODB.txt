СОЛНЦАНЕТ — Netlify сайт + Cal.com webhook → NocoDB

Что внутри:
- index.html — главная.
- zapis.html — встроенный календарь Cal.com.
- netlify/functions/cal-to-nocodb.js — обработчик webhook.
- netlify.toml — настройка функций Netlify.

Cal.com:
https://cal.com/solncanet

NocoDB endpoint:
https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records

Что нужно сделать после загрузки на Netlify:

1. В Netlify открыть сайт → Site configuration → Environment variables.
2. Добавить переменную:
   NOCODB_TOKEN = ваш API-токен NocoDB
3. Можно добавить переменную:
   NOCODB_ENDPOINT = https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records
   Но это необязательно, endpoint уже прописан в функции.
4. Перезагрузить deploy после добавления переменных.
5. В Cal.com открыть Webhooks.
6. Создать webhook:
   Event: Booking Created
   URL: https://ВАШ-САЙТ.netlify.app/.netlify/functions/cal-to-nocodb
7. Сделать тестовую запись.
8. Проверить, появилась ли строка в таблице "Заявки" в NocoDB.

Важно:
- Поля в NocoDB должны называться точно:
  Дата создания
  Имя клиента
  Телефон
  Услуга
  Дата записи
  Время записи
  Адрес
  м2
  Комментарий
  Статус
  Cal Booking ID
- Если названия отличаются, нужно изменить record в файле netlify/functions/cal-to-nocodb.js.
