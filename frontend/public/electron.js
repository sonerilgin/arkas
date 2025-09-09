const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Ana pencere oluştur
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'favicon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  // Uygulama yüklendikten sonra göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Development modunda DevTools aç
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Development modunda localhost, production'da dosya yükle
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Menu bar'ı kaldır (opsiyonel)
  Menu.setApplicationMenu(null);
}

// Electron hazır olduğunda
app.whenReady().then(createWindow);

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
  // macOS'ta dock'ta kalmaya devam et
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS'ta dock ikonuna tıklandığında pencere yeniden aç
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});