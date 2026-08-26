#!/usr/bin/env node
// Extract ESLint error signatures (file + rule id) from --format json output
// piped on stdin. Used by scripts/lint-gate.sh and `npm run lint:baseline`.
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  data += chunk;
});
process.stdin.on("end", () => {
  let results;
  try {
    results = JSON.parse(data);
  } catch {
    process.exitCode = 1;
    return;
  }
  const seen = new Set();
  for (const file of results) {
    const rel = file.filePath.split("/src/")[1];
    if (!rel) continue;
    for (const msg of file.messages) {
      if (msg.severity === 2 && msg.ruleId) {
        seen.add(`src/${rel}: ${msg.ruleId}`);
      }
    }
  }
  for (const line of [...seen].sort()) {
    console.log(line);
  }
});
