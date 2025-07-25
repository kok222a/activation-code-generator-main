const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  log: (message) => console.log(`[Renderer] ${message}`),
  test: () => {
    console.log('Renderer: Calling test IPC');
    return ipcRenderer.invoke('test');
  },
  mockGenerateCode: (params) => {
    console.log('Renderer: Calling mockGenerateCode IPC with params:', params);
    return ipcRenderer.invoke('mock-generate-code', params);
  },
  mockListCodes: () => {
    console.log('Renderer: Calling mockListCodes IPC');
    return ipcRenderer.invoke('mock-list-codes');
  },
  generateCode: (params) => {
    console.log('Renderer: Calling generateCode IPC with params:', params);
    return ipcRenderer.invoke('generate-code', params);
  },
  listCodes: () => {
    console.log('Renderer: Calling listCodes IPC');
    return ipcRenderer.invoke('list-codes');
  }
});