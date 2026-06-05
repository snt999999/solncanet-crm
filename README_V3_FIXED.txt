СОЛНЦАНЕТ — v3 fixed Cal.com → Netlify Function → NocoDB

Исправлено:
- Ошибка JavaScript SyntaxError: Unexpected identifier 'not'.
- Было: "value" not in rawValue
- Стало: !("value" in rawValue)

Что сделать:
1. Распаковать архив.
2. В GitHub открыть репозиторий solncanet-crm.
3. Заменить файл:
   netlify/functions/cal-to-nocodb.js
   на новый файл из этого архива.
   Проще: загрузить все файлы архива поверх старых через Add file → Upload files.
4. Commit changes.
5. Netlify сам сделает новый deploy.
6. После deploy открыть:
   https://solncanet-crm.netlify.app/.netlify/functions/cal-to-nocodb

Ожидаемый результат:
{
  "ok": true,
  "hasNocodbToken": true
}

Если hasNocodbToken false — проверить переменную NOCODB_TOKEN в Netlify.
