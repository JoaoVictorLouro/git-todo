"use strict";

import { app, BrowserWindow, ipcMain as ipc } from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import FS from "fs";

const FILE_PATH = "/home/joao/todos.json";

const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({ webPreferences: { nodeIntegration: true } });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
      })
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on("ready", () => {
  mainWindow = createMainWindow();
});

function writeTaskFile(tasks) {
  if (!tasks) {
    tasks = [];
  }
  FS.writeFileSync(FILE_PATH, JSON.stringify(tasks));

  return tasks;
}

function readTaskFile() {
  let tasks = [];
  const fileExists = FS.existsSync(FILE_PATH);
  if (!fileExists) {
    FS.writeFileSync(FILE_PATH, JSON.stringify(tasks));
  } else {
    tasks = JSON.parse(FS.readFileSync(FILE_PATH));
  }

  return tasks;
}

ipc.on("get-tasks", event => {
  try {
    const tasks = readTaskFile();
    event.reply("got-tasks", { success: true, tasks });
  } catch ({ message }) {
    event.reply("got-tasks", { success: false, error: message });
  }
});

ipc.on("save-task", (event, updatedTask) => {
  try {
    const tasks = readTaskFile();
    let task = tasks.find(task => task.id === updatedTask.id);
    let isNew = false;
    if (task) {
      task = Object.assign(task, updatedTask);
    } else {
      isNew = true;
      tasks.unshift(updatedTask);
    }
    writeTaskFile(tasks);
    event.reply("saved-task", { success: true, task, isNew });
  } catch ({ message }) {
    event.reply("saved-task", { success: false, task, isNew: false, error: message });
  }
});

ipc.on("move-task", (event, { id, direction }) => {
  try {
    const tasks = readTaskFile();
    const index = tasks.findIndex(task => task.id === id);

    if (direction === "up") {
      if (index > 0) {
        let before = tasks[index - 1];
        let actual = tasks[index];
        tasks[index - 1] = actual;
        tasks[index] = before;
        writeTaskFile(tasks);
        event.reply("moved-task", { success: true, id, direction });
      }
    } else if (direction === "down") {
      if (index < tasks.length - 1) {
        let after = tasks[index + 1];
        let actual = tasks[index];
        tasks[index + 1] = actual;
        tasks[index] = after;
        writeTaskFile(tasks);
        event.reply("moved-task", { success: true, id, direction });
      }
    }
  } catch ({ message }) {
    event.reply("moved-task", { success: false, id, direction });
  }
});

ipc.on("remove-task", (event, taskId) => {
  try {
    let tasks = readTaskFile();
    tasks = tasks.filter(task => task.id !== taskId);
    writeTaskFile(tasks);
    event.reply("removed-task", { success: true, taskId });
  } catch ({ message }) {
    event.reply("removed-task", { success: false, taskId, error: message });
  }
});

ipc.on("save-todo", (event, { todo, taskId }) => {
  try {
    const tasks = readTaskFile();
    const task = tasks.find(task => task.id === taskId);

    let oldTodo = task.todos.find(todo2 => todo2.id === todo.id);
    let isNew = false;

    if (oldTodo) {
      oldTodo = Object.assign(oldTodo, todo);
    } else {
      isNew = true;
      task.todos.push(todo);
    }
    writeTaskFile(tasks);
    event.reply("saved-todo", { success: true, todo: oldTodo, taskId, isNew });
  } catch ({ message }) {
    event.reply("saved-todo", { success: false, error: message, todo, taskId });
  }
});

ipc.on("remove-todo", (event, { id, taskId }) => {
  try {
    const tasks = readTaskFile();
    const task = tasks.find(task => task.id === taskId);

    task.todos = task.todos.filter(todo => todo.id !== id);

    writeTaskFile(tasks);
    event.reply("removed-todo", { success: true, id, taskId });
  } catch ({ message }) {
    event.reply("removed-todo", { success: false, error, id, taskId });
  }
});

ipc.on("move-todo", (event, { taskId, id, direction }) => {
  try {
    const tasks = readTaskFile();
    const task = tasks.find(task => task.id === taskId);

    const index = task.todos.findIndex(todo => todo.id === id);

    if (direction === "up") {
      if (index > 0) {
        let before = task.todos[index - 1];
        let actual = task.todos[index];
        task.todos[index - 1] = actual;
        task.todos[index] = before;
        writeTaskFile(tasks);
        event.reply("moved-todo", { success: true, taskId, id, direction });
      }
    } else if (direction === "down") {
      if (index < task.todos.length - 1) {
        let after = task.todos[index + 1];
        let actual = task.todos[index];
        task.todos[index + 1] = actual;
        task.todos[index] = after;
        writeTaskFile(tasks);
        event.reply("moved-todo", { success: true, taskId, id, direction });
      }
    }
  } catch ({ message }) {
    event.reply("moved-todo", { success: false, taskId, id, direction, error: message });
  }
});
