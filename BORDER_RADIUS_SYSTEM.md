# Система скруглений qaradakor.kz

Унифицированная система border-radius для всего проекта.

## Токены скруглений

| Токен | Значение | Tailwind класс | Применение |
|-------|----------|----------------|------------|
| `--radius-xs` | 6px (0.375rem) | `rounded-xs` | Бейджи уведомлений, close иконки, чекбоксы, тултипы |
| `--radius-sm` | 8px (0.5rem) | `rounded-sm` | Маленькие кнопки, теги, чипсы, тултипы |
| `--radius-md` | 12px (0.75rem) | `rounded-md` | Основные кнопки, инпуты, дропдауны, карточки |
| `--radius-lg` | 16px (1rem) | `rounded-lg` | Модальные окна, большие карточки фильмов |
| `--radius-xl` | 20px (1.25rem) | `rounded-xl` | Элементы сайдбара, навигационные кнопки, аватары |
| `--radius-2xl` | 24px (1.5rem) | `rounded-2xl` | Главный контейнер, hero-блоки, крупные панели |

## Компоненты и их скругления

### UI Components

- **Avatar**: `rounded-full` (круглые аватары)
- **Badge**: `rounded-xs` (6px) - мелкие элементы
- **Button**: 
  - default/lg: `rounded-md` (12px)
  - sm: `rounded-sm` (8px)
  - icon: `rounded-md` (12px)
- **Card**: `rounded-lg` (16px) - карточки контента
- **Checkbox**: `rounded-xs` (6px) - небольшие элементы формы
- **Dialog**: `rounded-lg` (16px) - модальные окна
- **Input**: `rounded-md` (12px) - стандартные поля ввода
- **Sheet**: `rounded-lg` (16px) - боковые панели
- **Skeleton**: `rounded-md` (12px) - загрузочные плейсхолдеры
- **Toggle**: `rounded-md` (12px) - переключатели
- **Tooltip**: `rounded-sm` (8px) - подсказки

### Sidebar & Navigation

- **Sidebar buttons**: `rounded-xl` (20px) - навигационные кнопки
- **Logo**: `rounded-xl` (20px) - логотип в сайдбаре
- **Avatar в sidebar**: `rounded-xl` (20px) - фото профиля
- **Dropdown меню**: `rounded-xl` (20px) - выпадающие списки
- **Mobile navigation**: `rounded-xl` (20px) - мобильная навигация

### Специальные случаи

- **Avatar**: всегда `rounded-full` (полностью круглый)
- **Notification badges**: `rounded-full` (круглые счётчики)
- **Chart tooltips**: `rounded-md` (12px)
- **Popover/Dropdown**: `rounded-xl` (20px) - всплывающие меню

## Правила использования

1. **Иерархия важности**: Чем важнее элемент в интерфейсе, тем больше скругление
2. **Навигация = XL**: Все навигационные элементы используют `rounded-xl`
3. **Формы = MD**: Поля ввода и кнопки форм используют `rounded-md`
4. **Декор = XS/SM**: Мелкие декоративные элементы используют `rounded-xs` или `rounded-sm`
5. **Контент = LG**: Карточки и контейнеры контента используют `rounded-lg`

## Исключения

- Аватары всегда круглые (`rounded-full`)
- Notification badges круглые (`rounded-full`)
- Toast уведомления - `rounded-md`

## Примеры использования

```tsx
// Кнопка навигации в сайдбаре
<button className="rounded-xl ...">

// Стандартная кнопка формы
<button className="rounded-md ...">

// Карточка фильма
<div className="rounded-lg ...">

// Badge с количеством
<span className="rounded-xs ...">

// Тултип
<div className="rounded-sm ...">
```

## Важно

- Не создавайте кастомные скругления без обоснования
- Используйте только токены из системы
- При добавлении нового компонента сверяйтесь с этой таблицей
