import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
};

const fsMap = await tsvfs.createDefaultMapFromCDN(compilerOptions, ts.version, false, ts);
fsMap.set('/main.ts', '');

const system = tsvfs.createSystem(fsMap);

console.log(ts.version);
console.log(tsvfs);
console.log(system.fileExists('/main.ts'));
console.log(system.readFile('/main.ts'));

const env = tsvfs.createVirtualTypeScriptEnvironment(system, ['/main.ts'], ts, compilerOptions);

console.log(env)
