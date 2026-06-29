import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  // allowJs: true,
};

const fsMap = await tsvfs.createDefaultMapFromCDN(
  compilerOptions,
  ts.version,
  false,
  ts,
);
// 初期ファイルを空文字 ("") にすると `createVirtualTypeScriptEnvironment()` が
// TS6053 を投げる既知の問題があるため、"\n" を初期値として登録
// fsMap.set('/main.ts', '\n');

const system = tsvfs.createSystem(fsMap);
const env = tsvfs.createVirtualTypeScriptEnvironment(
  system,
  [],
  ts,
  compilerOptions,
);

// 作成するコード
// const code = `
// document.body;
// `;

// // 仮想ファイルを作成
// env.createFile('/main.ts', code);
// // "document" の位置を取得

// const position = code.indexOf('document');
// // QuickInfo を取得

// const info = env.languageService.getQuickInfoAtPosition('/main.ts', position);

// console.log(info);
// console.log(ts.displayPartsToString(info.displayParts));
// console.log(ts.displayPartsToString(info.documentation));

const code = `
document.
`;

env.createFile('/main.ts', code);

const position = code.indexOf('.') + 1;

const completions = env.languageService.getCompletionsAtPosition(
  '/main.ts',
  position,
  {},
);

console.log(completions);
console.log(completions.entries.slice(0, 20));
