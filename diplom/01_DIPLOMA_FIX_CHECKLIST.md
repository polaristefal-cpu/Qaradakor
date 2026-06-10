# Checklist for fixing the diploma work

Документ: `2026.04.08_Дипломная (2).docx`

Регламент: `R-15 Правила выполнения квалифицированных работ бакалавриата, ред 3.pdf`

Дата проверки: 2026-05-14

## 1. Требования R-15

По OCR регламента R-15 ключевые требования такие:

- Объем основной части: 40-80 страниц, приложения не входят в объем.
- Структура: обложка, титульный лист, задание, календарный план, аннотация на трех языках, содержание, введение, основная часть, заключение, список литературы, приложения.
- Аннотация должна быть на казахском, русском и английском языках с ключевыми словами.
- Введение не более 2 страниц.
- Заключение не более 1 страницы.
- Формат: A4, печать на одной стороне.
- Шрифт: Times New Roman, кегль 14.
- Интервал: одинарный.
- Поля: левое 30 мм, верхнее 20 мм, правое 10 мм, нижнее 25 мм.
- Заголовки структурных элементов по центру, заглавными буквами, без точки в конце.
- Каждый раздел начинается с новой страницы.
- Нумерация страниц сквозная, номер внизу по центру, на титульном листе номер не ставится.
- Все рисунки и таблицы должны иметь ссылки в тексте.
- Рисунки и таблицы можно нумеровать в пределах раздела: `Figure 1.1`, `Table 1.1`.
- Список литературы оформляется по IEEE.
- Ссылки на источники в тексте указываются в квадратных скобках.
- Работа должна опираться минимум на 20 научных источников, преимущественно за последние 5-7 лет.
- До защиты нужны нормоконтроль, антиплагиат, отзыв руководителя и презентационные материалы.

## 2. Что уже хорошо

- Объем по свойствам Word: 58 страниц. Это попадает в диапазон 40-80 страниц.
- Поля документа соответствуют R-15: 30/20/10/25 мм.
- Основной стиль `Normal`: Times New Roman 14.
- Есть обложка, титульный лист, задание, календарный план.
- Есть аннотации на английском, казахском и русском языках.
- Есть введение, основная часть, заключение, список литературы.
- В работе описано реальное приложение Qaradakor.kz.
- Есть 20 источников, что формально соответствует минимальному количеству.

## 3. Критичные исправления

### 3.1 Исправить содержание

Проблема: после `CONTENTS` сейчас идет текст введения, а не полноценное содержание с разделами, подразделами и страницами.

Что сделать:

- Создать автосодержание Word.
- Включить в содержание:
  - `INTRODUCTION`
  - `1 DESCRIPTION AND ANALYSIS OF THE PROJECT`
  - все подразделы 1.x
  - `2 THEORETICAL DESIGN OF THE SYSTEM`
  - все подразделы 2.x
  - `3 PRACTICAL IMPLEMENTATION`
  - все подразделы 3.x
  - `CONCLUSION`
  - `REFERENCES`
  - `APPENDICES`
- Обновить номера страниц после всех правок.

### 3.2 Исправить стили заголовков

Проблема: многие обычные абзацы размечены как `Heading 1` или `Heading 2`. Из-за этого автосодержание и навигация Word будут неправильными.

Что сделать:

- Обычный текст перевести в стиль `Normal`.
- Только крупные разделы оставить как `Heading 1`.
- Подразделы `1.1`, `1.2`, `2.1`, `3.1` оставить как `Heading 2`.
- Подподразделы, если нужны, оформить как `Heading 3`.
- Проверить Navigation Pane в Word: там не должно быть обычных абзацев.

Примеры проблемных мест:

- Абзацы введения после `INTRODUCTION` размечены как `Heading 1`.
- Некоторые абзацы после `1.1 Relevance of the topic` размечены как `Heading 2`.
- В разделе AI часть обычных пунктов также размечена как `Heading 2`.

### 3.3 Исправить аннотации

Проблема: русская аннотация не содержит строку `Ключевые слова`.

Что сделать:

- В английской аннотации оставить `Keywords: ...`.
- В казахской аннотации оставить `Түйін сөздер: ...`.
- В русскую аннотацию добавить:

```text
Ключевые слова: веб-приложение, рекомендательная система, искусственный интеллект, чат-бот, фильмы, база данных, казахский язык.
```

### 3.4 Добавить приложения

Проблема: R-15 включает приложения в обязательную структуру. В текущем тексте нет раздела `APPENDICES` и нет ссылок на приложения.

Что добавить:

- `APPENDIX A - User interface screenshots`
- `APPENDIX B - API endpoint table`
- `APPENDIX C - Database and KV storage structure`
- `APPENDIX D - Selected code fragments`
- `APPENDIX E - Testing results`

В тексте основной части добавить ссылки:

- `The main user interface screenshots are presented in Appendix A.`
- `The complete list of backend endpoints is provided in Appendix B.`
- `The KV storage model is summarized in Appendix C.`
- `Selected implementation fragments are shown in Appendix D.`
- `Testing artifacts are provided in Appendix E.`

### 3.5 Исправить нумерацию рисунков

Проблемы:

- `Figure 1.1` используется дважды.
- В главе 2 идет `Figure 2.4`, потом `Figure 2.3`.
- В главе 3 повторяются `Figure 3.4` и `Figure 3.5`.
- Есть подписи рисунков без фактического изображения.

Что сделать:

- Пройти по всем рисункам сверху вниз.
- Нумеровать внутри главы:
  - `Figure 1.1`, `Figure 1.2`, `Figure 1.3`
  - `Figure 2.1`, `Figure 2.2`, `Figure 2.3`
  - `Figure 3.1`, `Figure 3.2`, `Figure 3.3`
- На каждый рисунок добавить ссылку в тексте перед ним:
  - `as shown in Figure 3.1`
  - `Figure 3.1 illustrates ...`
- Удалить подписи, если самого рисунка нет.

### 3.6 Исправить таблицы

Критичная ошибка:

```text
Table 3.1 - Comparison of homomorphic encryption techniques
```

Эта таблица не относится к Qaradakor.kz и выглядит как вставка из другой работы.

Что сделать:

- Удалить эту таблицу или заменить ее на таблицу AI-компонентов:

```text
Table 3.1 - AI components of the Qaradakor.kz platform
```

Пример структуры:

| Component | Endpoint | Input data | Output | Purpose |
| --- | --- | --- | --- | --- |
| CineBot | `/ai/chat` | user message, history, watched movies | answer, movie cards | conversational movie discovery |
| Review analysis | `/ai/analyze-review` | review text, movie title | sentiment JSON | review sentiment classification |
| Movie explanation | `/ai/explain` | movieId, watched history | short explanation | explainable recommendation |
| Recommendations | `/recommendations` | watched, ratings, TMDB metadata | ranked movie list | personalization |

## 4. Синхронизация с реальным приложением

### 4.1 AI model

Проблема: в дипломе написано `gpt-4o-mini`, но в коде backend сейчас стоит:

```ts
model: "gpt-5.4-mini"
```

Решение:

- Либо изменить код на фактически используемую модель.
- Либо изменить текст диплома и написать актуальную модель.
- Главное: везде должна быть одна и та же модель.

### 4.2 Domain

Проблема: в разных местах встречаются разные домены:

- `qaradakor.kz`
- `qaradakor.sofine.kz`

Решение:

- Выбрать один фактический production domain.
- Привести все места в дипломе к одному варианту.

### 4.3 Recommendation system

Проблема: диплом местами говорит о hybrid/collaborative/ML-подходах шире, чем видно в коде.

Реальный код больше похож на:

- Content-based scoring.
- Candidate generation через TMDB recommendations/similar.
- Учет жанров, режиссеров, актеров, сценаристов.
- Учет popularity/vote_average.
- Diversity filtering.

Рекомендуемая формулировка:

```text
The recommendation module uses a content-based scoring approach enriched with TMDB candidate generation and diversity filtering. The system builds a user taste profile from watched movies and ratings, collects candidate movies from TMDB recommendations and similar-movie endpoints, and ranks them using weighted genre, director, actor, writer, popularity and rating signals.
```

### 4.4 2FA and passwordless login

Реально в коде есть:

- `/auth/2fa-status`
- `/auth/2fa-setup-send`
- `/auth/2fa-setup-confirm`
- `/auth/2fa-disable`
- `/auth/send-otp`
- `/auth/verify-otp`
- `/auth/sms-login-send`
- `/auth/sms-login-verify`

В дипломе нужно описывать именно эти endpoint-группы, а не абстрактные `/otp/send` и `/otp/verify`.

## 5. Неподтвержденные утверждения

Следующие утверждения лучше либо подтвердить приложениями, либо убрать/смягчить:

- `Approximate factual accuracy: 92% based on 50 control queries`.
- `Sentiment analysis accuracy: 94% based on 100 reviews`.
- `Recommendation relevance: 4.3 out of 5`.
- `Six development sprints`.
- `Approximately 400 person-hours`.
- `Security scan confirmed HSTS, clickjacking defenses and XSS headers`.
- `Automated checks such as type-checking and linting are executed before each deployment`.
- `Formal load/performance testing`.

Как смягчить:

```text
During manual testing, the AI chatbot demonstrated stable behavior on typical movie recommendation queries.
```

Вместо:

```text
The chatbot achieved 92% factual accuracy.
```

## 6. Английская редактура

Нужно исправить:

- `english-speaking` -> `English-speaking`
- `kazakh language` -> `Kazakh language`
- `russian` -> `Russian`
- `According to statist` -> `According to Statista`
- `Open-AI` -> `OpenAI`
- `LLMS` -> `LLMs`
- `react` -> `React`
- `tailwind CSS` -> `Tailwind CSS`
- `javascript` -> `JavaScript`
- `typescript` -> `TypeScript`
- `node.js` -> `Node.js`
- `docker` -> `Docker`
- `chapsters` -> `chapters`
- `compiex` -> `complex`
- `two-stage verification` -> `two-factor authentication`

Также переписать машинные фразы:

```text
The client scenarios have the opportunity to work with the chatbot...
```

Лучше:

```text
In the third scenario, a user interacts with the AI chatbot to request personalized movie suggestions in natural language.
```

## 7. References

Формально 20 источников есть, но качество нужно усилить.

Что добавить:

- 5-8 свежих научных источников по recommender systems, explainable AI, LLMs in recommendation, web security.
- Желательно IEEE, ACM, Springer, Elsevier, Scopus/Web of Science.
- Документацию React, Supabase, TMDB, OpenAI оставить, но не считать ее основной научной базой.

Что исправить:

- Привести все источники к IEEE style.
- Проверить, чтобы каждая ссылка `[n]` использовалась в тексте.
- Проверить, чтобы все URL были рабочими.
- Убрать источники без автора/названия/даты, если они выглядят слабо.

## 8. Финальный контроль перед сдачей

- [ ] Word Navigation Pane показывает только реальные заголовки.
- [ ] Содержание автоматически обновлено.
- [ ] Все номера страниц в содержании корректны.
- [ ] Все рисунки имеют изображения, подписи и ссылки в тексте.
- [ ] Все таблицы имеют подписи и ссылки в тексте.
- [ ] Нет повторной нумерации рисунков/таблиц.
- [ ] Аннотации на трех языках содержат ключевые слова.
- [ ] Введение не больше 2 страниц.
- [ ] Заключение не больше 1 страницы.
- [ ] Есть раздел `APPENDICES`.
- [ ] Есть ссылки на все приложения.
- [ ] AI model, domain, endpoints совпадают с кодом.
- [ ] Удалены неподтвержденные метрики или приложены доказательства.
- [ ] References оформлены по IEEE.
- [ ] Документ прошел spelling/grammar check.
- [ ] Документ сохранен в финальной версии PDF/DOCX.

