/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AcceptanceTestSuite } from './TestSuite.ts';

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
});

console.log('---------------------------------------------------------------');
console.log(`Summary: ${report.totalPassed} Passed, ${report.totalFailed} Failed (Total: ${report.totalCases})`);

if (report.allPassed) {
  console.log('\x1b[32m\n>>> ALL 22 ACCEPTANCE & INVARIANT TESTS PASSED SUCCESSFULLY! <<<\x1b[0m\n');
  process.exit(0);
} else {
  console.error('\x1b[31m\n>>> TEST SUITE FAILED WITH ' + report.totalFailed + ' FAILURES <<<\x1b[0m\n');
  process.exit(1);
}
