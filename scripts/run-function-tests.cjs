const { spawnSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const base = path.join(__dirname, '..', 'supabase', 'functions');
let tests = [];
try {
  tests = walk(base).filter(f => f.endsWith('.test.ts'));
} catch (e) {
  console.log('No function tests found.');
  process.exit(0);
}

if (tests.length === 0) {
  console.log('No function tests found.');
  process.exit(0);
}

for (const f of tests) {
  console.log('Running', f);
  const r = spawnSync('npx', ['tsx', f], { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('Test failed:', f);
    process.exit(r.status || 1);
  }
}
console.log('All function tests passed.');
process.exit(0);
