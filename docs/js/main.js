import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';


/**
 * TypeScriptの仮想ファイルシステム(VFS)を遅延初期化する。
 * @returns {Promise<vfs.VirtualTypeScriptEnvironment>} 初期化された仮想環境。
 */
/*
async #bootVfs() {
  // Lazy initialization パターン
  // this.#bootPromise が nullish (null or undefined) の場合のみ、
  // 右辺の即時実行非同期関数を評価・代入する
  this.#bootPromise ??= (async () => {
    // CDNからTypeScriptの型定義ファイル(.d.ts)をダウンロードしてVFSを初期化
    log('bootPromise')
    const defaultMap = await vfs.createDefaultMapFromCDN(
      {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
      ts.version,
      false,
      ts
    );
    
    
    
    
    //const url = `https://typescript.azureedge.net/cdn/${version}/typescript/lib/lib.dom.d.ts`
    //const text = await fetch(url).then(r => r.text())
    //vfs.set('/lib.dom.d.ts', text)
    
    
    //const map = await createDefaultMapFromCDN(ts, tsVersion, ts.ScriptTarget.ES2022, false, ts.ModuleKind.ESNext)
    //const p5Dts = await fetch('https://esm.sh/@types/p5/index.d.ts').then(r => r.text())
    //map.set('/node_modules/@types/p5/index.d.ts', p5Dts)
    
    
    
    const system = vfs.createSystem(defaultMap);

    // LSPサーバーがコードを解析する際のルールを定義
    const compilerOptions = {
      // 生成するJSのバージョンを指定。'ES2015'以上でないとプライベート識別子(#)などでエラーになる
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler, // URLベースのimportなど、モダンなモジュール解決を許可する
      allowArbitraryExtensions: true, // .js や .ts 以外の拡張子を持つファイルをインポートできるようにする
      allowJs: true, // .js ファイルのコンパイルを許可する
      checkJs: true, // .js ファイルに対しても型チェックを行う (JSDocと連携)
      strict: true, // すべての厳格な型チェックオプションを有効にする (noImplicitAnyなどを含む)
      noUnusedLocals: true, // 未使用のローカル変数をエラーとして報告する
      noUnusedParameters: true, // 未使用の関数パラメータをエラーとして報告する
    };

    // 仮想環境を作成し、定義したコンパイラオプションを渡す
    const env = vfs.createVirtualTypeScriptEnvironment(
      system,
      [],
      ts,
      compilerOptions
    );
    
    

    this.#defaultMap = defaultMap;
    this.#system = system;
    this.#env = env;
    log('vfs booted (ts:', ts.version, ')');
    //self.postMessage({method: '__ready'});
    return env;
  })();
  return this.#bootPromise;
}
*/
console.log(tsvfs);
