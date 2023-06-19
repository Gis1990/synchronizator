<h1>Последовательность для запуска приложения:</h1>
<ol>
  <li>Добавить рабочий Mongo URI в <code>.env</code></li>
  <li><code>yarn install</code></li>
</ol>

<p>В <code>package.json</code> вынесены все скрипты:</p>
<pre>
  <code>"scripts": {
    "build": "tsc -w", // компилируем
    "start": "node ./dist/app.js", // стартуем добавление объектов в БД
    "synchronizeCustomersRealtime": "node ./dist/sync.js", // аномизация в реальном времени
    "synchronizeCustomersFullReindex": "node ./dist/sync.js --full-reindex" // аномизация всей БД
  }</code>
</pre>

<p>Теперь к паре замечаний по ТЗ:</p>
<ol>
  <li>Не понятно можно ли добавлять дополнительные поля в объекты при сохранении в БД.</li>
  <li>Нужно ли сразу сохранять пришедшие данные в БД или подымать сервер с каким-то эндпоинтом и потом уже слать объекты на него, например, при помощи Axios.</li>
  <li>Можно ли использовать брокеры сообщений, например, RabbitMQ? Можно ли следить за состоянием изменений в БД при помощи методов MongoDB, например, <code>changeStream = collection.watch()</code>?</li>
</ol>

