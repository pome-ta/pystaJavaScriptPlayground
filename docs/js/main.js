import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
};

const fsMap = await tsvfs.createDefaultMapFromCDN(
  compilerOptions,
  ts.version,
  false,
  ts,
);
// 初期ファイルを空文字 ("") にすると `createVirtualTypeScriptEnvironment()` が
// TS6053 を投げる既知の問題があるため、"\n" を初期値として登録
fsMap.set('/main.ts', '\n');

const system = tsvfs.createSystem(fsMap);
const env = tsvfs.createVirtualTypeScriptEnvironment(
  system,
  ['/main.ts'],
  ts,
  compilerOptions,
);

console.log(env);
