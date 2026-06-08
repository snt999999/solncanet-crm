# СОЛНЦАНЕТ CRM — чистая структура для GitHub

## Как залить

1. В GitHub очистить репозиторий.
2. Распаковать этот архив.
3. В GitHub нажать `Add file → Upload files`.
4. Перетащить ВСЁ СОДЕРЖИМОЕ распакованной папки, не саму папку.
5. В корне GitHub должны лежать:
   - `index.html`
   - `zapis.html`
   - `admin.html`
   - `assets/`
   - `netlify/`
   - `netlify.toml`
6. Нажать `Commit changes`.
7. Дождаться `Published` в Netlify.

## Переменные Netlify

В Netlify → Site configuration → Environment variables должны быть:

- `NOCODB_TOKEN` — токен NocoDB.
- `ADMIN_PASSWORD` — пароль для входа в админку.
- `NOCODB_ENDPOINT` — необязательно, endpoint уже прописан в функциях.

## Адреса

- Главная: https://solncanet-crm.netlify.app/
- Онлайн-запись: https://solncanet-crm.netlify.app/zapis.html
- Админка: https://solncanet-crm.netlify.app/admin.html
- Проверка функций: https://solncanet-crm.netlify.app/.netlify/functions/test
- Проверка NocoDB: https://solncanet-crm.netlify.app/.netlify/functions/nocodb-test
- Проверка webhook Cal.com: https://solncanet-crm.netlify.app/.netlify/functions/cal-nocodb-v5

## Webhook Cal.com

URL:
https://solncanet-crm.netlify.app/.netlify/functions/cal-nocodb-v5

Триггер:
`Бронирование создано`

Секретный ключ:
оставить пустым

Custom Payload Template:
выключен

## Поля таблицы Заявки

Обязательные поля:
- Имя клиента
- Телефон
- Услуга
- Дата записи
- Время записи
- Адрес
- м2
- Комментарий
- Статус
- Cal Booking ID

Желательные поля для редактирования из админки:
- Итоговый м2
- Ответственный
- Комментарий администратора
- Создан объект

Endpoint заявок:
https://app.nocodb.com/api/v3/data/ptvxn8nmuwc08y3/mgp2zjsuv4id5tp/records
