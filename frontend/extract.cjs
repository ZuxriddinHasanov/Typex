const fs = require('fs');

// Path to transcript
const transcriptPath = 'C:\\Users\\yaxyo\\.gemini\\antigravity-cli\\brain\\2c88e977-06f5-47ef-b6e6-41b99f0c9c44\\.system_generated\\logs\\transcript_full.jsonl';

const data = fs.readFileSync(transcriptPath, 'utf8');
const lines = data.trim().split('\n');

let targetContent = null;

// Find the last user message containing the code
for (let i = lines.length - 1; i >= 0; i--) {
  const line = JSON.parse(lines[i]);
  if (line.type === 'USER_INPUT' && line.content.includes('export function AdminUsersPage(): JSXElement {')) {
    targetContent = line.content;
    break;
  }
}

if (!targetContent) {
  console.log('Target content not found!');
  process.exit(1);
}

// Extract the code block
let code = targetContent.substring(targetContent.indexOf('// oxlint-disable'));
code = code.substring(0, code.lastIndexOf('} qara shu fayldan xatolikni tuzat') + 1);

// Now we need to remove the duplicate block inside the code.
// The duplicate block starts at `class={cn(` around line 615 of the extracted text.
// It ends exactly before `          {/* Last Test & Activity */}`

const duplicateStartStr = `                </div>
                class={cn(
                  "rounded-2xl px-5 py-2.5 text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-95",`;
const correctStartStr = `                </div>
              </div>
            </div>`;
const nextSectionStr = `          {/* Last Test & Activity */}`;

if (code.includes('class={cn(') && code.includes('Blokdan ochish" : "Bloklash"}')) {
  // We can just use string manipulation to cut the duplicate block out.
  const duplicateStartIdx = code.indexOf(duplicateStartStr);
  const nextSectionIdx = code.indexOf(nextSectionStr);
  
  if (duplicateStartIdx !== -1 && nextSectionIdx !== -1 && nextSectionIdx > duplicateStartIdx) {
    // Keep everything up to the duplicate start (but add the correct closing divs)
    const beforeDuplicate = code.substring(0, duplicateStartIdx);
    const afterDuplicate = code.substring(nextSectionIdx);
    
    code = beforeDuplicate + correctStartStr + "\n\n" + afterDuplicate;
  }
}

fs.writeFileSync('C:\\Users\\yaxyo\\typex\\frontend\\src\\ts\\components\\pages\\admin\\AdminUsersPage.tsx', code);
console.log('Done!');
