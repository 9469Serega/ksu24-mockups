# KSU24 — макети у фірмовому стилі ХДУ

Макети платформи [KSU24](https://ksu24.kspu.edu/) за [стайлгайдом ХДУ](https://kspu.edu/styleguide): лендинг, вхід, кабінет студента, залікова книжка, документообіг і мобільна версія кабінету.

Кожна папка — набір із шести екранів, який створила окрема модель Claude за однаковим завданням.

| Папка | Модель | Екрани |
|---|---|---|
| `opus-5.5/` | Claude Opus 5.5 | [Лендинг KSU24](opus-5.5/Main.dc.html), [Вхід](opus-5.5/Login.dc.html), [Кабінет студента](opus-5.5/Dashboard.dc.html), [Залікова книжка](opus-5.5/Gradebook.dc.html), [Документообіг](opus-5.5/Documents.dc.html), [Кабінет — телефон](opus-5.5/Mobile.dc.html) |
| `sonnet-5.5/` | Claude Sonnet 5.5 | [Лендинг](sonnet-5.5/Main.dc.html), [Вхід](sonnet-5.5/Login.dc.html), [Кабінет студента](sonnet-5.5/Cabinet.dc.html), [Залікова книжка](sonnet-5.5/Gradebook.dc.html), [Документообіг](sonnet-5.5/Documents.dc.html), [Кабінет, мобільна версія](sonnet-5.5/CabinetMobile.dc.html) |
| `fable-5.2/` | Claude Fable 5.2 | [Лендинг](fable-5.2/Main.dc.html), [Вхід](fable-5.2/Login.dc.html), [Кабінет студента](fable-5.2/Cabinet.dc.html), [Залікова книжка](fable-5.2/Gradebook.dc.html), [Документообіг](fable-5.2/Documents.dc.html), [Кабінет — мобільна версія](fable-5.2/CabinetMobile.dc.html) |

## Як це влаштовано

Кожен екран — файл `*.dc.html`: шаблон усередині `<x-dc>` і клас `Component` з даними та обробниками. Файл `support.js` у папці набору перетворює шаблон на звичайну сторінку: підставляє значення, розгортає цикли й умови, обробляє кліки.
