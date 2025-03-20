const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
  // Элементы управления окном
  const minBtn = document.getElementById('min-btn');
  const closeBtn = document.getElementById('close-btn');

  minBtn.addEventListener('click', () => {
    ipcRenderer.send('window-control', 'minimize');
  });

  closeBtn.addEventListener('click', () => {
    ipcRenderer.send('window-control', 'close');
  });

  // Элементы профиля и темы
  const avatar = document.getElementById('avatar');
  const username = document.getElementById('username');
  const themeToggleSwitch = document.getElementById('themeToggleSwitch');

  // Элементы настроек пути
  const altvPathInput = document.getElementById('altvPathInput');
  const savePathBtn = document.getElementById('savePathBtn');

  // Элементы переключателей и кнопок
  const debugToggle = document.getElementById('debug');
  const discordOverlayToggle = document.getElementById('discordOverlay');
  const externalConsoleToggle = document.getElementById('externalConsole');
  const branchButtons = document.querySelectorAll('.branch-btn');
  const openTomlBtn = document.getElementById('openToml');
  const launchAltvBtn = document.getElementById('launchAltv');

  // Переключения между вкладками
  const navIcon = document.getElementById('navIcon');
  const mainView = document.getElementById('mainView');
  const settingsView = document.getElementById('settingsView');

  // Элементы погрузки AHK
  const ahkPathInput = document.getElementById('ahkPathInput');
  const saveAhkPathBtn = document.getElementById('saveAhkPathBtn');

  if (window.__rendererInitialized) {
    // Фикс дабл клика
    return;
  }
  window.__rendererInitialized = true;

  // Переключения между вкладками
  navIcon.addEventListener('click', () => {
    if (mainView.style.display !== 'none') {
      mainView.style.display = 'none';
      settingsView.style.display = 'block';
    } else {
      settingsView.style.display = 'none';
      mainView.style.display = 'block';
    }
  });

  // Уведомления
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Обновление altv.toml
  async function updateTomlConfig(changedFields = {}) {
    const response = await ipcRenderer.invoke('read-toml');
    if (response.error) {
      console.error(response.error);
      return;
    }
    const newConfig = { ...response, ...changedFields };
    const writeRes = await ipcRenderer.invoke('write-toml', newConfig);
    if (writeRes.error) console.error(writeRes.error);
  }

  // Загрузка конфигурации из altv.toml
  async function loadTomlConfig() {
    const config = await ipcRenderer.invoke('read-toml');
    if (config.error) {
      console.error(config.error);
      return;
    }
    debugToggle.checked = config.debug;
    discordOverlayToggle.checked = config.enableDiscordOverlay;
    externalConsoleToggle.checked = config.useExternalConsole;
    
    branchButtons.forEach(btn => {
      if (btn.getAttribute('data-value') === config.branch) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Загрузка общей конфигурации
  async function loadAppConfig() {
    const config = await ipcRenderer.invoke('get-config');
    if (config.altvPath) {
      altvPathInput.value = config.altvPath;
    } else {
      showNotification('Укажите путь до altV!', 'error')
    }
    if (config.ahkPath) {
      ahkPathInput.value = config.ahkPath;
    }
    document.documentElement.setAttribute('data-theme', config.theme || 'dark');
    if (document.getElementById('themeToggleSwitch')) {
      document.getElementById('themeToggleSwitch').checked = (config.theme === 'dark');
    }

    if (config.avatar) {
      avatar.src = config.avatar;
    }
    if (config.username) {
      username.textContent = config.username;
    }
  }

  loadTomlConfig();
  loadAppConfig();

  // Переключение темы
  themeToggleSwitch.addEventListener('change', () => {
    const newTheme = themeToggleSwitch.checked ? 'dark' : 'light';
    // Если вы использовали document.body.dataset.theme ранее:
    document.body.dataset.theme = newTheme;
    ipcRenderer.invoke('save-theme', newTheme)
      .then(() => showNotification('Тема сохранена!', 'success'))
      .catch(err => console.error(err));
  });

  // Выбор аватара
  avatar.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        avatar.src = reader.result;
        ipcRenderer.invoke('save-avatar', reader.result)
          .then(() => showNotification('Аватар сохранён!', 'success'))
          .catch(err => console.error(err));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });

  // Изменение ника
  const prompt = require('electron-prompt');
  let isNamePromptOpen = false;

  username.addEventListener('click', () => {
    if (isNamePromptOpen) return;
    isNamePromptOpen = true;
    
    prompt({
      title: 'Изменить имя',
      label: 'Введите новое имя:',
      value: username.textContent,
      inputAttrs: { type: 'text', maxlength: 16 },
      type: 'input'
    })
    .then(newName => {
      isNamePromptOpen = false;
      if (newName !== null && newName.trim().length > 0) {
        username.textContent = newName;
        ipcRenderer.invoke('save-username', newName)
          .then(() => showNotification('Имя сохранено!', 'success'))
          .catch(err => console.error(err));
      }
    })
    .catch(err => {
      isNamePromptOpen = false;
      console.error(err);
    });
  });

  // Сохранение нового пути к alt файлам
  savePathBtn.addEventListener('click', async () => {
    const newPath = altvPathInput.value.trim();
    if (!newPath) {
      alert('Введите корректный путь!');
      return;
    }
    const res = await ipcRenderer.invoke('update-config', newPath);
    if (res.error) {
      console.error(res.error);
      showNotification('Ошибка сохранения.', 'error');
    } else {
      showNotification('Путь сохранён.', 'success');
    }
  });

  // Переключение Debug
  debugToggle.addEventListener('change', () => {
    updateTomlConfig({ debug: debugToggle.checked });
  });

  // Переключение Discord Overlay
  discordOverlayToggle.addEventListener('change', () => {
    updateTomlConfig({ enableDiscordOverlay: discordOverlayToggle.checked });
  });

  // Переключение External Console
  externalConsoleToggle.addEventListener('change', () => {
    updateTomlConfig({ useExternalConsole: externalConsoleToggle.checked });
  });

  // Обработка branch кнопок
  branchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      branchButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateTomlConfig({ branch: btn.getAttribute('data-value') });
    });
  });

  // Открыть altv.toml в редакторе
  openTomlBtn.addEventListener('click', async () => {
    await ipcRenderer.invoke('open-toml');
  });

  // Запустить altv.exe
  launchAltvBtn.addEventListener('click', async () => {
    if (launchAltvBtn.disabled) return;
    launchAltvBtn.disabled = true;
    const res = await ipcRenderer.invoke('launch-altv');
    if (res.error) {
      console.error(res.error);
      showNotification('Ошибка запуска', 'error');
    }
    setTimeout(() => {
      launchAltvBtn.disabled = false;
    }, 2000);
  });  

  // Сохранения пути до AHK
  saveAhkPathBtn.addEventListener('click', async () => {
    const newAhkPath = ahkPathInput.value.trim();
    if (!newAhkPath) {
      showNotification('Введите корректный путь!');
      return;
    }
    const res = await ipcRenderer.invoke('save-ahk-path', newAhkPath);
    if (res.error) {
      showNotification('Ошибка сохранения!', 'error');
    } else {
      showNotification('AHK путь сохранён!', 'success');
    }
  });
});