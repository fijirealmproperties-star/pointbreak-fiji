const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const SERVER_URL = "https://pointbreak-fiji.onrender.com";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: "#0a1628",
    icon: path.join(__dirname, "..", "mobile", "assets", "icon.png"),
    title: "PointBreak Rides Fiji",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0a1628",
      symbolColor: "#EAF6FF",
      height: 36,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
