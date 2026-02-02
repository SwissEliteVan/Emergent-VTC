const fs = require('fs');
const path = require('path');

const budgetKb = Number(process.env.PERF_BUDGET_KB || 150);
const nextBuildDir = path.join(process.cwd(), '.next', 'static');

if (!fs.existsSync(nextBuildDir)) {
  console.log('No .next build found. Run `npm run build` before perf budget check.');
  process.exit(0);
}

let totalBytes = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      totalBytes += stat.size;
    }
  }
};

walk(nextBuildDir);
const totalKb = totalBytes / 1024;

if (totalKb > budgetKb) {
  console.error(`Performance budget exceeded: ${totalKb.toFixed(2)}KB > ${budgetKb}KB`);
  process.exit(1);
}

console.log(`Performance budget OK: ${totalKb.toFixed(2)}KB <= ${budgetKb}KB`);
