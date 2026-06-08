СОЛНЦАНЕТ CRM — Админ-панель v1

Файлы:
- admin.html — админ-панель заявок
- assets/admin.css — стили
- assets/admin.js — логика
- netlify/functions/list-zayavki.js — получение заявок из NocoDB
- netlify/functions/update-zayavka.js — обновление заявки

Что сделать в Netlify:
1. Добавить переменную ADMIN_PASSWORD — пароль для входа в админку.
2. NOCODB_TOKEN уже должен быть добавлен.
3. Сделать redeploy.

Адрес админки:
https://solncanet-crm.netlify.app/admin.html

Поля, которые ожидает админка:
Имя клиента, Телефон, Услуга, Дата записи, Время записи, Адрес, м2, Комментарий, Статус, Cal Booking ID.
Желательные дополнительные поля: Итоговый м2, Ответственный, Комментарий администратора, Создан объект.

Endpoint:
https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records
