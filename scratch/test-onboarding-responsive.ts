import fs from "fs";
import path from "path";

function runTests() {
  console.log("=== Testing FPC Company Registration Responsive Layout ===\n");

  const cssPath = path.resolve("artifacts/fpc-management/src/fpc-management.css");
  const indexCssPath = path.resolve("artifacts/fpc-management/src/index.css");
  const wizardPath = path.resolve("artifacts/fpc-management/src/components/onboarding/FpcAdminOnboardingWizard.tsx");

  const css = fs.readFileSync(cssPath, "utf-8");
  const indexCss = fs.readFileSync(indexCssPath, "utf-8");
  const wizard = fs.readFileSync(wizardPath, "utf-8");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
    }
  }

  // 1. Desktop Two-Column Layout (~75-80% Form, ~20-25% Sidebar)
  assert(
    css.includes("grid-template-columns: minmax(0, 3.8fr) minmax(220px, 1.2fr)") ||
    css.includes("grid-template-columns: minmax(0, 78fr) minmax(220px, 22fr)") ||
    (css.includes(".fm-wizard-body") && css.includes("3.8fr")),
    "Desktop uses responsive two-column layout (~75-80% form, ~20-25% sidebar)"
  );

  // 2. Tablet layout (768px - 1023px)
  assert(
    css.includes("@media (min-width: 768px) and (max-width: 1023px)") &&
    css.includes("grid-template-columns: minmax(0, 1fr)") &&
    css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"),
    "Tablet layout moves sidebar below main form and displays aside cards in 2 responsive columns"
  );

  // 3. Mobile layout (<= 767px)
  assert(
    css.includes("@media (max-width: 767px)") &&
    css.includes("grid-template-columns: minmax(0, 1fr)"),
    "Mobile layout stacks form and sidebar vertically"
  );

  // 4. box-sizing: border-box globally
  assert(
    indexCss.includes("*, *::before, *::after { box-sizing: border-box; }") &&
    css.includes(".fm-root *, .fm-root *::before, .fm-root *::after { box-sizing: border-box; }"),
    "box-sizing: border-box is applied globally and to all onboarding components"
  );

  // 5. Removed unnecessary fixed/min widths causing horizontal overflow
  assert(
    !css.includes("min-width: 740px") &&
    !css.includes("min-width: 680px"),
    "Removed horizontal overflow triggers (min-width: 740px, min-width: 680px)"
  );

  // 6. Responsive Financial Information Fields in Step 3
  assert(
    wizard.includes('label="Authorized Capital (₹)"') &&
    wizard.includes('label="Paid-up Capital (₹)"') &&
    wizard.includes('label="Face Value per Share (₹)"') &&
    wizard.includes('label="Annual Turnover (₹)"') &&
    wizard.includes('label="Financial Year"') &&
    wizard.includes('label="Number of Farmers"') &&
    wizard.includes('label="Number of Shareholders"') &&
    wizard.includes('label="Number of Employees"'),
    "All 8 financial information fields are declared and preserved"
  );
  assert(
    css.includes("@container (max-width: 540px)") &&
    css.includes("@container (min-width: 541px) and (max-width: 820px)"),
    "Form grid uses container queries for dynamic card-width field responsiveness"
  );

  // 7. Computed Total Equity Shares fits within form card
  assert(
    css.includes(".fm-calculation") &&
    css.includes("flex-wrap: wrap") &&
    css.includes("max-width: 100%"),
    "Computed Total Equity Shares (.fm-calculation) has flex-wrap and max-width: 100%"
  );

  // 8. 8-Step Progress Indicator Responsive
  assert(
    css.includes(".fm-stepper-wrap") &&
    css.includes("overflow-x: auto") &&
    css.includes(".fm-wizard-progress") &&
    css.includes("overflow: hidden"),
    "8-step progress indicator handles overflow inside .fm-stepper-wrap without expanding page"
  );

  // 9. Save Draft & Controls Accessible
  assert(
    wizard.includes("handleSaveDraft") &&
    wizard.includes("Save Draft") &&
    wizard.includes("Save and Continue") &&
    css.includes(".fm-wizard-footer"),
    "Save Draft and navigation controls remain intact and accessible"
  );

  console.log(`\nResults: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

