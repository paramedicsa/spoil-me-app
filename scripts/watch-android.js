#!/usr/bin/env node
// scripts/watch-android.js
// Watch source files, rebuild the web app, sync Capacitor, and assemble the Android APK on changes.

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

const WATCH_PATHS = [
  'src',
  'public',
  'www',
  'package.json',
  'vite.config.js',
  'vite.config.ts',
  'capacitor.config.ts',
  'capacitor.config.js',
  'tsconfig.json',
  'index.html'
];

const DEBOUNCE_MS = 1200;
let timer = null;
let running = false;

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: opts.shell || false, cwd: opts.cwd || process.cwd() });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function buildAndAssemble(dry = false) {
  if (running) return;
  running = true;
  console.log('[android-watch] change detected -> building...');

  try {
    // 1) web build
    if (dry) {
      console.log('[android-watch] dry run: skipping npm build.');
    } else {
      await runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
    }

    // 2) capacitor sync
    if (dry) {
      console.log('[android-watch] dry run: skipping npx cap sync android.');
    } else {
      await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android']);
    }

    // 3) gradle assemble (use shell:true for Windows flexibility)
    const androidDir = path.join(process.cwd(), 'android');
    const gradleCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
    if (dry) {
      console.log(`[android-watch] dry run: would run ${gradleCmd} assembleDebug in ${androidDir}`);
    } else {
      await runCommand(gradleCmd, ['assembleDebug'], { cwd: androidDir, shell: process.platform === 'win32' });
    }

    console.log('[android-watch] build complete.');
  } catch (err) {
    console.error('[android-watch] error:', err.message || err);
  } finally {
    running = false;
  }
}

function shouldIgnore(pathname) {
  // Ignore node_modules and hidden files
  return /(^|[\\/])node_modules([\\/]|$)/.test(pathname) || /(^|[\\/])\./.test(pathname);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry') || args.includes('-d');

const watcher = chokidar.watch(WATCH_PATHS, { ignored: shouldIgnore, ignoreInitial: true, persistent: true });
watcher.on('all', (event, p) => {
  clearTimeout(timer);
  timer = setTimeout(() => buildAndAssemble(dry), DEBOUNCE_MS);
});

console.log('[android-watch] watching for changes. Press Ctrl+C to stop. Dry mode:', dry);

// If run with --once, perform a single build then exit
if (args.includes('--once')) {
  (async () => {
    await buildAndAssemble(dry);
    process.exit(0);
  })();
}

