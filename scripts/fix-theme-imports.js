#!/usr/bin/env node
/**
 * Fix theme imports: Replace static `colors` import with useColors() hook
 * in all React component files that import from tokens.
 */
const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Find all .ts and .tsx files in src/ and app/
const files = glob.sync("{app,src}/**/*.{ts,tsx}", { cwd: path.resolve(__dirname, "..") });

let modified = 0;
let skipped = 0;

for (const relFile of files) {
  const absFile = path.resolve(__dirname, "..", relFile);
  let content = fs.readFileSync(absFile, "utf8");

  // Skip if file doesn't import colors from tokens
  if (!content.includes('from "') && !content.includes("from '")) continue;

  // Check if file imports static `colors` from tokens
  const tokensImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']([^"']*tokens[^"']*)["'];?/;
  const match = content.match(tokensImportRegex);
  if (!match) continue;

  const fullImport = match[0];
  const imports = match[1].split(",").map((s) => s.trim());

  // Only process files that import `colors` (the static object)
  if (!imports.includes("colors")) continue;

  // Skip if file already imports useColors
  if (imports.includes("useColors")) {
    // Just remove `colors` from imports, keep useColors
    const newImports = imports.filter((i) => i !== "colors");
    const newImport = fullImport.replace(
      /\{[^}]+\}/,
      `{ ${newImports.join(", ")} }`
    );
    content = content.replace(fullImport, newImport);
    fs.writeFileSync(absFile, content);
    console.log(`UPDATED (already had useColors): ${relFile}`);
    modified++;
    continue;
  }

  // Replace `colors` with `useColors` in the import
  const newImports = imports.map((i) => (i === "colors" ? "useColors" : i));
  const newImport = fullImport.replace(
    /\{[^}]+\}/,
    `{ ${newImports.join(", ")} }`
  );
  content = content.replace(fullImport, newImport);

  // Now we need to add `const colors = useColors();` inside each function component
  // Strategy: find function component declarations and add the hook after the opening brace
  // Patterns: `export default function X() {` or `export function X()` or `function X()`
  const componentPatterns = [
    /export\s+default\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    /(?:^|\n)\s*function\s+(\w+)\s*\([^)]*\)\s*\{/g,
  ];

  let addedHook = false;

  for (const pattern of componentPatterns) {
    let result;
    pattern.lastIndex = 0;
    while ((result = pattern.exec(content)) !== null) {
      const matchStart = result.index;
      const openBraceIdx = content.indexOf("{", matchStart + result[0].length - 1);

      // Check if there's already a useColors() call nearby (within 500 chars after the brace)
      const afterBrace = content.substring(openBraceIdx, openBraceIdx + 500);
      if (afterBrace.includes("useColors()")) continue;

      // Find the right insertion point - after the opening brace and any immediate newlines
      const insertAfter = openBraceIdx + 1;

      // Check what's already there
      const existingContent = content.substring(insertAfter, insertAfter + 200).trimStart();

      // Don't add if the first thing is already a hook call or state
      if (existingContent.startsWith("const ") && existingContent.includes("= use")) continue;
      if (existingContent.startsWith("const [")) continue;

      // Insert the hook call
      const indentation = "  "; // 2 spaces
      const hookLine = `\n${indentation}const colors = useColors();\n`;
      content = content.substring(0, insertAfter) + hookLine + content.substring(insertAfter);
      addedHook = true;
      break; // Only add once per file (to the first component found)
    }
    if (addedHook) break;
  }

  // Special case: if we didn't find a component pattern but the file uses colors
  // This handles files where the component pattern is unusual
  if (!addedHook) {
    // Check if file has any JSX (likely a component)
    if (content.includes("<View") || content.includes("<Text") || content.includes("<TouchableOpacity")) {
      // Try to find the first function and add hook there
      const funcMatch = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/);
      if (funcMatch) {
        const openBraceIdx = content.indexOf("{", funcMatch.index + funcMatch[0].length - 1);
        const insertAfter = openBraceIdx + 1;
        const hookLine = `\n  const colors = useColors();\n`;
        content = content.substring(0, insertAfter) + hookLine + content.substring(insertAfter);
        addedHook = true;
      }
    }
  }

  fs.writeFileSync(absFile, content);
  if (addedHook) {
    console.log(`UPDATED: ${relFile}`);
    modified++;
  } else {
    console.log(`SKIPPED (no component found): ${relFile}`);
    skipped++;
  }
}

console.log(`\nDone. Modified: ${modified}, Skipped: ${skipped}`);
