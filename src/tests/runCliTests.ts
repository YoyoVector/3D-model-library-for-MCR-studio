/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AcceptanceTestSuite } from './TestSuite.ts';
import { testReadmeSnippets } from './readmeCompilationTest.ts';

console.log('===============================================================');
console.log('  MCR-Studio Parametric 3D Library - Automated Test Runner');
console.log('===============================================================');

const report = AcceptanceTestSuite.runAll();

console.log(`\nExecuted ${report.totalCases} acceptance & engineering invariant test cases:`);
console.log('---------------------------------------------------------------');

report.cases.forEach((c) => {
  const badge = c.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`${badge} ${c.id.padEnd(8)}: ${c.name}`);
  console.log(`       Result: ${c.actual}`);
  if (!c.passed && c.details !== undefined) {
    console.log(`       Details: ${JSON.stringify(c.details).slice(0, 2000)}`);
  }
});

// README snippets must run exactly as documented.
let readmeOk = true;
try {
  testReadmeSnippets();
  console.log('\x1b[32m[PASS]\x1b[0m README  : README.md snippets execute as documented');
} catch (err: any) {
  readmeOk = false;
  console.log(`\x1b[31m[FAIL]\x1b[0m README  : ${err?.message ?? err}`);
}

console.log('---------------------------------------------------------------');
console.log(`Summary: ${report.totalPassed} Passed, ${report.totalFailed} Failed (Total: ${report.totalCases}), README snippets ${readmeOk ? 'OK' : 'FAILED'}`);

if (report.allPassed && readmeOk) {
  console.log(`\x1b[32m\n>>> ALL ${report.totalCases} ACCEPTANCE & INVARIANT TESTS PASSED SUCCESSFULLY! <<<\x1b[0m\n`);
  process.exit(0);
} else {
  console.error(`\x1b[31m\n>>> TEST SUITE FAILED WITH ${report.totalFailed + (readmeOk ? 0 : 1)} FAILURES <<<\x1b[0m\n`);
  process.exit(1);
}
