const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const constants = require('fs').constants;

// 啟用詳細日誌
app.commandLine.appendSwitch('enable-logging');
app.commandLine.appendSwitch('log-level', '0');

// 全局錯誤處理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  fs.appendFile('error.log', `Uncaught Exception: ${error.stack}\n`).catch(console.error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  fs.appendFile('error.log', `Unhandled Rejection: ${reason}\n`).catch(console.error);
});

// 初始化 Firebase
async function initializeFirebase() {
  try {
    const serviceAccountPath = app.isPackaged
      ? path.join(process.resourcesPath, 'serviceAccountKey.json')
      : path.join(__dirname, '..', 'serviceAccountKey.json');
    console.log('Checking serviceAccountKey.json at:', serviceAccountPath);
    await fs.access(serviceAccountPath, constants.F_OK);
    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://roblox-whitelist-892c2-default-rtdb.firebaseio.com'
    });
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    await fs.appendFile('error.log', `Firebase initialization failed: ${error.message}\n`);
    app.quit();
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  // 動態解析 index.html 路徑
  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'build', 'index.html')
    : path.join(__dirname, '..', 'build', 'index.html');
  console.log('Attempting to load index.html from:', indexPath);

  fs.access(indexPath, constants.F_OK)
    .then(() => {
      const indexURL = `file://${indexPath}`;
      console.log('Loading URL:', indexURL);
      win.loadURL(indexURL).catch((error) => {
        console.error('Failed to load index.html:', error);
        fs.appendFile('error.log', `Failed to load index.html: ${error.message}\n`).catch(console.error);
        app.quit();
      });
    })
    .catch((error) => {
      console.error('index.html not found at:', indexPath, error);
      fs.appendFile('error.log', `index.html not found at: ${indexPath}\n`).catch(console.error);
      app.quit();
    });

  // 開啟 DevTools（調試用）
  win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  console.log('App is ready, creating window');
  await initializeFirebase();
  createWindow();

  // 測試 Firebase 連線
  const db = admin.database();
  const testRef = db.ref('test');
  testRef.set({ timestamp: Date.now() })
    .then(() => console.log('Firebase test write successful'))
    .catch((error) => console.error('Firebase test write failed:', error));
}).catch((error) => {
  console.error('App failed to start:', error);
  fs.appendFile('error.log', `App failed to start: ${error.message}\n`).catch(console.error);
});

// IPC 處理函數
ipcMain.handle('test', async () => {
  try {
    return 'Test successful';
  } catch (error) {
    console.error('IPC test error:', error);
    throw error;
  }
});

ipcMain.handle('generate-code', async (event, length, count) => {
  try {
    const db = admin.database();
    const ref = db.ref('activationCodes');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codes = [];

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      codes.push({ code, used: false, createdAt: Date.now() });
    }

    const updates = {};
    codes.forEach((codeObj) => {
      const newCodeRef = ref.push();
      updates[newCodeRef.key] = codeObj;
    });

    await ref.update(updates);
    return codes.map((codeObj) => codeObj.code);
  } catch (error) {
    console.error('Generate code error:', error);
    throw error;
  }
});

ipcMain.handle('list-codes', async () => {
  try {
    const db = admin.database();
    const ref = db.ref('activationCodes');
    const snapshot = await ref.once('value');
    const codes = [];
    snapshot.forEach((childSnapshot) => {
      codes.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    return codes;
  } catch (error) {
    console.error('List codes error:', error);
    throw error;
  }
});

ipcMain.handle('log', async (event, message) => {
  console.log('Renderer log:', message);
  await fs.appendFile('renderer.log', `${new Date().toISOString()}: ${message}\n`);
});

// 應用程式事件
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});