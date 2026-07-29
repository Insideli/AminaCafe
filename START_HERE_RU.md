# С чего начать

1. Откройте локальный файл `tools/staff-config.html` двойным кликом.
2. Введите новые пароли сотрудников и нажмите «Создать безопасную конфигурацию».
3. Скопируйте значения `STAFF_ACCOUNTS_JSON` и `AMINA_SESSION_SECRET`.
4. В Vercel → проект → Settings → Environment Variables добавьте:
   - `STAFF_ACCOUNTS_JSON`
   - `AMINA_SESSION_SECRET`
   - `PALOMA_AUTHKEY`
   - `PALOMA_HOST` = `https://api.paloma365.com`
5. Добавьте переменные сначала для Preview и Production.
6. Загрузите эту версию проекта в отдельную ветку GitHub, например `paloma-secure-test`.
7. Откройте Preview deployment Vercel и войдите под администратором.
8. В той же вкладке откройте `/api/paloma?action=health`, найдите правильный `point_id`.
9. Добавьте в Vercel `PALOMA_POINT_ID` и сделайте Redeploy.
10. В админке нажмите «Проверить связь», затем «Синхронизировать».
11. В Firebase Firestore удалите старый документ `amina_db/amina_roles_v12`.
12. Создайте один тестовый заказ и проверьте его в Paloma365.
13. Только после успешного теста переносите ветку в `main`.

Важно: не публикуйте содержимое переменных Vercel и не вставляйте их в файлы проекта.
