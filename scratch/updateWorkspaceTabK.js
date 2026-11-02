const fs = require('fs');
const path = 'artifacts/fpc-management/src/FpcWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '          {activeTab === "baseline_surveys" && (';
const endMarker = '          {/* TAB J: REPORTS & ANALYTICS */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `          {/* TAB K: BASELINE ASSESSMENT, FIELD SURVEYS & IMPACT INDICATORS */}
          {activeTab === "baseline_surveys" && (
            <div style={{ marginTop: "0.25rem" }}>
              <BaselineSurveysModule
                state={state}
                setState={setState}
                role={role as any}
                fpcId={fpc.id}
                setToast={setToast}
                go={go}
              />
            </div>
          )}

`;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(path, content, 'utf8');
console.log('FpcWorkspace.tsx Tab K updated successfully!');

