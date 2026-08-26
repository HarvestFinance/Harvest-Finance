"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
const {
  unstable_prepareDebuggerShell,
  unstable_spawnDebuggerShellWithArgs,
} = require("@react-native/debugger-shell");
const { spawn } = require("child_process");
const ChromeLauncher = require("chrome-launcher");
const { Launcher: EdgeLauncher } = require("chromium-edge-launcher");
const open = require("open");
const DefaultToolLauncher = {
  launchDebuggerAppWindow: async (url) => {
    if (process.env.NODE_ENV === "test") {
      assertMockedInTests();
    }
    let chromePath;
    try {
      chromePath = ChromeLauncher.getChromePath();
    } catch (e) {
      chromePath = EdgeLauncher.getFirstInstallation();
    }
    if (chromePath == null) {
      await open(url);
      return;
    }
    const chromeFlags = [`--app=${url}`, "--window-size=1200,600"];
    return new Promise((resolve, reject) => {
      const childProcess = spawn(chromePath, chromeFlags, {
        detached: true,
        stdio: "ignore",
      });
      childProcess.on("data", () => {
        resolve();
      });
      childProcess.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Failed to launch debugger app window: ${chromePath} exited with code ${code}`,
            ),
          );
        }
      });
    });
  },
  async launchDebuggerShell(url, windowKey) {
    if (process.env.NODE_ENV === "test") {
      assertMockedInTests();
    }
    return await unstable_spawnDebuggerShellWithArgs([
      "--frontendUrl=" + url,
      "--windowKey=" + windowKey,
    ]);
  },
  async prepareDebuggerShell(prebuiltBinaryPath) {
    if (process.env.NODE_ENV === "test") {
      assertMockedInTests();
    }
    return await unstable_prepareDebuggerShell();
  },
};
function assertMockedInTests() {
  if (process.env.NODE_ENV === "test") {
    throw new Error(
      "DefaultToolLauncher must be mocked or overridden in tests. " +
        "Add jest.mock('../utils/DefaultAppLauncher') to test setup.",
    );
  }
}
var _default = (exports.default = DefaultToolLauncher);
