import http from 'http';
import { exec } from 'child_process';

const TARGET_URL = 'http://localhost:3002/';
const MAX_ATTEMPTS = 60; // 30 seconds max wait

let attempts = 0;

function checkFrontendReady() {
  attempts++;
  http.get(TARGET_URL, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log(`[Browser Launcher] Frontend is online & responding on ${TARGET_URL}`);
      console.log(`[Browser Launcher] Opening default browser...`);
      openBrowser(TARGET_URL);
    } else {
      retry();
    }
  }).on('error', () => {
    retry();
  });
}

function retry() {
  if (attempts < MAX_ATTEMPTS) {
    setTimeout(checkFrontendReady, 500);
  } else {
    console.warn(`[Browser Launcher] Timed out waiting for ${TARGET_URL}. Please open http://localhost:3002 manually.`);
  }
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

// Start polling
checkFrontendReady();
