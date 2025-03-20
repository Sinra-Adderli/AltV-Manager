# AltV Manager

## Описание

**AltV Manager** — это приложение, созданное с использованием [Electron](https://electronjs.org/), позволяющее управлять настройками файлов altv. Приложение предоставляет удобный графический интерфейс для:
- Чтения и записи файла `altv.toml`
- Настройки пути к файлам altv (сохранение в пользовательском каталоге)
- Переключения различных параметров запуска (Debug, Discord Overlay, External Console)
- Выбора ветки (release, rc, dev)
- Управления профилем пользователя: загрузка аватара и редактирование имени
- Переключения темы (тёмная/светлая) с сохранением настроек

## Скачать установщик

1. [Releases](https://github.com/Sinra-Adderli/AltV-Manager/releases/tag/v1.0)

## Установка

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/yourusername/altv_manager.git
   cd altv_manager
   ```

2. **Установите зависимости:**

   ```bash
   npm install
   ```

## Запуск в режиме разработки

Для запуска приложения в режиме разработки используйте:

```bash
npm start
```


## Сборка

Для создания исполняемого файла (EXE) используется [electron-builder](https://www.electron.build/):

1. **Убедитесь, что все зависимости установлены:**

   ```bash
   npm install
   ```

2. **Запустите сборку:**

   ```bash
   npm run dist
   ```

После сборки итоговый установочный файл появится в папке `dist`.

## Конфигурация

- Файл конфигурации `config.json` хранится в пользовательском каталоге (через `app.getPath('userData')`).
- Параметры, такие как путь к alt файлам, тема, аватар и имя пользователя, сохраняются в этом файле.

## Требования

- [Node.js](https://nodejs.org/) и [npm](https://www.npmjs.com/)
- [Electron](https://electronjs.org/)
- [electron-builder](https://www.electron.build/)

## Лицензия

Этот проект распространяется под лицензией MIT.

## Скин приложения

![image](https://github.com/user-attachments/assets/22560a8f-34ae-4561-8d98-f50b13cf5260)
