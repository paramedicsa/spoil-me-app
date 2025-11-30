#!/usr/bin/env node
// scripts/watch-android.cjs
// CommonJS version of the watcher for projects with "type": "module"

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;

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
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code))));
  });
}

// Enhanced findApk: accepts flavor and buildType to look in flavor-specific output locations first
async function findApk(androidDir, flavor, buildType) {
  // Normalize buildType
  const bt = (buildType || 'debug').toLowerCase();

  const candidates = [];
  // Common Gradle outputs for flavors and build types
  if (flavor) {
    candidates.push(path.join(androidDir, 'app', 'build', 'outputs', 'apk', flavor, bt));
    candidates.push(path.join(androidDir, 'app', 'build', 'outputs', 'apk', flavor + '-' + bt));
  }
  candidates.push(path.join(androidDir, 'app', 'build', 'outputs', 'apk', bt));
  candidates.push(path.join(androidDir, 'build', 'outputs', 'apk', bt));

  for (const dir of candidates) {
    try {
      const files = await fs.readdir(dir);
      const apks = files.filter(f => f.endsWith('.apk')).map(f => path.join(dir, f));
      if (apks.length) return selectNewest(apks);
    } catch (e) {
      // ignore
    }
  }

  // Fallback: recursive search up to depth for any .apk under androidDir
  const apks = [];
  async function walk(dir, depth) {
    if (depth <= 0) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(p, depth - 1);
      } else if (entry.isFile() && entry.name.endsWith('.apk')) {
        apks.push(p);
      }
    }
  }

  await walk(androidDir, 6);
  if (apks.length) return selectNewest(apks);
  return null;
}

async function selectNewest(paths) {
  let newest = null;
  let newestMtime = 0;
  for (const p of paths) {
    try {
      const st = await fs.stat(p);
      const m = st.mtimeMs || 0;
      if (m > newestMtime) {
        newestMtime = m;
        newest = p;
      }
    } catch (e) {
      // ignore
    }
  }
  return newest;
}

async function installApk(apkPath, deviceId) {
  if (!apkPath) throw new Error('No APK path provided');
  console.log('[android-watch] installing APK to device:', apkPath);
  const args = ['install', '-r', apkPath];
  if (deviceId) {
    // target specific device
    args.unshift('-s', deviceId);
  }
  // Use shell:true for adb to ensure environment resolution on Windows
  await runCommand('adb', args, { shell: true });
}

async function buildAndAssemble(dry = false, doInstall = false, options = {}) {
  if (running) return;
  running = true;
  console.log('[android-watch] change detected -> building...');

  const { release, flavor, apkPath, deviceId } = options;
  const buildType = release ? 'release' : 'debug';

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

    // Determine variant task: assemble[Flavor][BuildType] or assemble[BuildType]
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    const variant = flavor ? capitalize(flavor) + capitalize(buildType) : capitalize(buildType);
    const assembleTask = 'assemble' + variant;

    if (dry) {
      console.log('[android-watch] dry run: would run ' + (process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew') + ' ' + assembleTask + ' in ' + androidDir);
    } else {
      await runCommand(process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew', [assembleTask], { cwd: androidDir, shell: process.platform === 'win32' });
    }

    // If requested, locate APK and install via adb
    if (!dry && doInstall) {
      try {
        let apk = apkPath;
        if (!apk) {
          apk = await findApk(androidDir, flavor, buildType);
        }
        if (!apk) {
          console.error('[android-watch] could not find built APK to install');
        } else {
          await installApk(apk, deviceId);
          console.log('[android-watch] apk installed successfully');
        }
      } catch (e) {
        console.error('[android-watch] error installing APK:', e.message || e);
      }
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
const doInstall = args.includes('--install') || args.includes('--adb');

// New flags
const release = args.includes('--release') || args.includes('-r');
let flavor = null;
if (args.includes('--flavor')) {
  const i = args.indexOf('--flavor');
  if (i >= 0 && args[i+1]) flavor = args[i+1];
}
let apkPath = null;
if (args.includes('--apk-path')) {
  const i = args.indexOf('--apk-path');
  if (i >= 0 && args[i+1]) apkPath = args[i+1];
}
let deviceId = null;
if (args.includes('--device')) {
  const i = args.indexOf('--device');
  if (i >= 0 && args[i+1]) deviceId = args[i+1];
}

const watcher = chokidar.watch(WATCH_PATHS, { ignored: shouldIgnore, ignoreInitial: true, persistent: true });
watcher.on('all', (event, p) => {
  clearTimeout(timer);
  timer = setTimeout(() => buildAndAssemble(dry, doInstall, { release, flavor, apkPath, deviceId }), DEBOUNCE_MS);
});

console.log('[android-watch] watching for changes. Press Ctrl+C to stop. Dry mode:', dry, 'Install:', doInstall, 'Release:', release, 'Flavor:', flavor, 'APK path:', apkPath, 'Device:', deviceId);

// If run with --once, perform a single build then exit
if (args.includes('--once')) {
  (async () => {
    await buildAndAssemble(dry, doInstall, { release, flavor, apkPath, deviceId });
    process.exit(0);
  })();
}
