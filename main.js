const remoteMain = require('@electron/remote/main');
remoteMain.initialize();
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const toml = require('@iarna/toml');

let mainWindow;

const configPath = path.join(app.getPath('userData'), 'config.json');

// Если файла нет
function loadConfig() {
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      altvPath: "",
      theme: "dark",
      ahkPath: "",
      username: "User Name",
      avatar: "icon.ico"
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  const data = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(data);
}

function saveConfig(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
}

let userConfig = loadConfig();

function getPaths() {
  const altvPath = userConfig.altvPath;
  return {
    altvPath,
    tomlFilePath: path.join(altvPath, 'altv.toml'),
    altvExePath: path.join(altvPath, 'altv.exe')
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 370,
    height: 630,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
  remoteMain.enable(mainWindow.webContents);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Чтение altv.toml
ipcMain.handle('read-toml', async () => {
  const { tomlFilePath } = getPaths();
  try {
    const fileContent = fs.readFileSync(tomlFilePath, 'utf-8');
    const config = toml.parse(fileContent);
    return config;
  } catch (err) {
    console.error('Ошибка чтения файла TOML:', err);
    return { error: err.message };
  }
});

// Запись altv.toml
ipcMain.handle('write-toml', async (event, newConfig) => {
  const { tomlFilePath } = getPaths();
  try {
    const newToml = toml.stringify(newConfig);
    fs.writeFileSync(tomlFilePath, newToml, 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Ошибка записи файла TOML:', err);
    return { error: err.message };
  }
});

// Открыть altv.toml
ipcMain.handle('open-toml', async () => {
  const { tomlFilePath } = getPaths();
  shell.openPath(tomlFilePath);
});

// Заупск altV и ahk
ipcMain.handle('launch-altv', async () => {
  const { altvExePath } = getPaths();
  const { execFile } = require('child_process');

  if (!fs.existsSync(altvExePath)) {
    console.error(`altv.exe не найден по пути: ${altvExePath}`);
    return { error: 'altv.exe не найден' };
  }
  
  execFile(altvExePath, { shell: true }, (err) => {
    if (err) {
      console.error('Ошибка запуска altv.exe:', err);
    }
  });
  
  if (userConfig.ahkPath) {
    if (fs.existsSync(userConfig.ahkPath)) {
      execFile(userConfig.ahkPath, { shell: true }, (err) => {
        if (err) {
          console.error('Ошибка запуска AHK:', err);
        }
      });
    } else {
      console.error('AHK файл не найден по указанному пути:', userConfig.ahkPath);
    }
  }
  
  return { success: true };
});

// Обновление пути к alt файлам
ipcMain.handle('update-config', async (event, newAltvPath) => {
  userConfig.altvPath = newAltvPath;
  try {
    saveConfig(userConfig);
    return { success: true, newConfig: userConfig };
  } catch (err) {
    console.error('Ошибка сохранения config.json:', err);
    return { error: err.message };
  }
});

// Сохранение темы
ipcMain.handle('save-theme', async (event, theme) => {
  userConfig.theme = theme;
  try {
    saveConfig(userConfig);
    return { success: true };
  } catch (err) {
    console.error('Ошибка сохранения темы:', err);
    return { error: err.message };
  }
});

// Сохранение аватарки
ipcMain.handle('save-avatar', async (event, avatarData) => {
  userConfig.avatar = avatarData;
  try {
    saveConfig(userConfig);
    return { success: true };
  } catch (err) {
    console.error('Ошибка сохранения аватарки:', err);
    return { error: err.message };
  }
});

// Сохранение имени пользователя
ipcMain.handle('save-username', async (event, username) => {
  userConfig.username = username;
  try {
    saveConfig(userConfig);
    return { success: true };
  } catch (err) {
    console.error('Ошибка сохранения имени:', err);
    return { error: err.message };
  }
});

// Отправка общей конфигурации
ipcMain.handle('get-config', async () => {
  return userConfig;
});

// Управление окнвми
ipcMain.on('window-control', (event, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') {
    mainWindow.minimize();
  } else if (action === 'close') {
    mainWindow.close();
  }
});

// Сохранить путь до AHK
ipcMain.handle('save-ahk-path', async (event, ahkPath) => {
  userConfig.ahkPath = ahkPath;
  try {
    saveConfig(userConfig);
    return { success: true };
  } catch (err) {
    console.error('Ошибка сохранения AHK пути:', err);
    return { error: err.message };
  }
});
