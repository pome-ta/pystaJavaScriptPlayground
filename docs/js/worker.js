import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('ja-JP', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

/**
 * Worker 内部からのログ送信（eruda等での表示用）
 * @param {string} message - 送信するメッセージ
 * @param {number} type - 1:Error, 2:Warning, 3:Info, 4:Log
 */
function postLog(message, type = 3) {
  try {
    self.postMessage({
      jsonrpc: '2.0',
      method: 'worker/log',
      params: {
        type,
        message: `[${formatTime()}] [Worker] ${message}`,
      },
    });
  } catch (e) {
    // postMessage が例外になっても沈黙
  }
}

class BrowserLanguageServer {
  #fsMap;
  #system;
  #env;
  #ready = false;
  #envId = 0;
  #documentTimers = new Map(); // Diagnosticsのデバウンス用

  // 1. compilerOptions をクラス内で一元管理
  #compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    allowImportingTsExtensions: true,
    allowArbitraryExtensions: true,
    allowJs: true,
    checkJs: true,
    noUnusedLocals: true,
  };

  #requestHandlers = {
    initialize: this.#handleInitialize.bind(this),
    'textDocument/completion': this.#handleCompletion.bind(this),
    'textDocument/hover': this.#handleHover.bind(this),
  };

  #notificationHandlers = {
    initialized: this.#handleInitialized.bind(this),
    'textDocument/didOpen': this.#handleDidOpen.bind(this),
    'textDocument/didChange': this.#handleDidChange.bind(this),
    'textDocument/didClose': this.#handleDidClose.bind(this),
  };
  // --- ユーティリティ: 座標変換 ---
  #getOffsetFromLSPPosition(uri, position) {
    const sourceFile = this.#env.getSourceFile(uri);
    if (!sourceFile) {
      throw new Error(`Source file not found: ${uri}`);
    }
    // LSPのPosition (line, character) は0ベース。TSのAPIも0ベースを想定しています。
    return ts.getPositionOfLineAndCharacter(sourceFile, position.line, position.character);
  }

  // --- ユーティリティ: TSのKindをLSPのCompletionItemKind(数値)に変換 ---
  #getCompletionItemKind(tsKind) {
    // 参照: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#completionItemKind
    switch (tsKind) {
      case ts.ScriptElementKind.primitiveType:
      case ts.ScriptElementKind.keyword:
        return 14; // Keyword
      case ts.ScriptElementKind.constElement:
        return 21; // Constant
      case ts.ScriptElementKind.letElement:
      case ts.ScriptElementKind.variableElement:
      case ts.ScriptElementKind.localVariableElement:
        return 6; // Variable
      case ts.ScriptElementKind.classElement:
        return 7; // Class
      case ts.ScriptElementKind.interfaceElement:
        return 8; // Interface
      case ts.ScriptElementKind.typeElement:
        return 25; // TypeParameter
      case ts.ScriptElementKind.enumElement:
        return 13; // Enum
      case ts.ScriptElementKind.functionElement:
      case ts.ScriptElementKind.localFunctionElement:
        return 3; // Function
      case ts.ScriptElementKind.memberFunctionElement:
        return 2; // Method
      case ts.ScriptElementKind.memberGetAccessorElement:
      case ts.ScriptElementKind.memberSetAccessorElement:
      case ts.ScriptElementKind.memberVariableElement:
        return 5; // Field
      case ts.ScriptElementKind.moduleElement:
        return 9; // Module
      case ts.ScriptElementKind.string:
        return 1; // Text
      default:
        return 10; // Property
    }
  }

  // --- ユーティリティ: TSのOffsetをLSPのPositionに変換 ---
  #getLSPPositionFromOffset(uri, offset) {
    const sourceFile = this.#env.getSourceFile(uri);
    if (!sourceFile) {
      throw new Error(`Source file not found: ${uri}`);
    }
    return ts.getLineAndCharacterOfPosition(sourceFile, offset);
    // return !sourceFile
    //   ? { line: 0, character: 0 }
    //   : ts.getLineAndCharacterOfPosition(sourceFile, offset);
  }

  // --- ユーティリティ: TSのDiagnosticCategoryをLSPのDiagnosticSeverityに変換 ---
  #getDiagnosticSeverity(category) {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 1; // Error
      case ts.DiagnosticCategory.Warning:
        return 2; // Warning
      case ts.DiagnosticCategory.Message:
        return 3; // Information
      case ts.DiagnosticCategory.Suggestion:
        return 4; // Hint
      default:
        return 1;
    }
  }

  // --- ハンドラ: 補完の実行 ---
  async #handleCompletion(params) {
    const uri = params.textDocument.uri;
    const position = params.position;

    // 1. LSPの座標をTSのオフセットに変換
    const offset = this.#getOffsetFromLSPPosition(uri, position);

    try {
      // 2. TS Compiler API から補完候補を取得
      const completions = this.#env.languageService.getCompletionsAtPosition(uri, offset, {
        includeCompletionsForModuleExports: false, // 今回はシンプルにするため外部エクスポートは含めない
        includeCompletionsWithInsertText: true,
      });

      if (!completions || !completions.entries) {
        return null; // 候補がない場合は null を返す
      }

      // 3. TSの補完リストをLSPのフォーマットにマッピング
      const items = completions.entries.map((entry) => {
        return {
          label: entry.name,
          kind: this.#getCompletionItemKind(entry.kind),
          sortText: entry.sortText,
          // 補完実行時に挿入されるテキスト（定義されていなければlabelが使われる）
          insertText: entry.insertText,
        };
      });

      return {
        isIncomplete: false,
        items,
      };
    } catch (e) {
      postLog(`Completion error: ${e.message}`, 1);
      return null;
    }
  }

  async handleMessage(message) {
    const { id, method, params } = message;

    try {
      if (id !== undefined) {
        const handler = this.#requestHandlers[method];
        if (handler) {
          if (method !== 'initialize' && !this.#ready) {
            throw new Error('Server is not ready yet');
          }
          const result = await handler(params);
          return { jsonrpc: '2.0', id, result };
        } else {
          // 未実装メソッドへのフォールバック
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method ${method} not implemented`,
            },
          };
        }
      } else {
        const handler = this.#notificationHandlers[method];
        if (handler) {
          if (method !== 'initialized' && !this.#ready) return null;
          await handler(params);
        }
        return null;
      }
    } catch (err) {
      postLog(`Error handling ${method}: ${err.message}`, 1);
      if (id !== undefined) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: err.message || String(err) },
        };
      }
      return null;
    }
  }

  async #handleInitialize(params) {
    await this.#init();
    return {
      capabilities: {
        textDocumentSync: 1, // Full Sync
        hoverProvider: true,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: ['.', '"', "'", '/', '@', '<'],
        },
      },
    };
  }

  async #handleInitialized() {
    postLog('Client and Server successfully connected.');
  }

  async #handleDidOpen(params) {
    const { uri, text } = params.textDocument;
    const initialText = text.trim() === '' ? '\n' : text;
    this.#env.createFile(uri, initialText);
    postLog(`Opened file: ${uri}`);

    this.#triggerDiagnostics(uri);
  }

  async #handleDidChange(params) {
    const { uri } = params.textDocument;
    const text = params.contentChanges[0].text;
    const validText = text.trim() === '' ? '\n' : text;
    this.#env.updateFile(uri, validText);

    this.#triggerDiagnostics(uri);
  }

  async #handleDidClose(params) {
    const { uri } = params.textDocument;
    this.#env.deleteFile(uri);
    postLog(`Closed file: ${uri}`);
  }

  // --- ハンドラ: Hover (ホバー情報の取得) ---

  async #handleHover(params) {
    // LSPから送られてくる params は { textDocument: { uri: "..." }, position: { ... } }
    const uri = params.textDocument.uri;
    const position = params.position;
    const offset = this.#getOffsetFromLSPPosition(uri, position);

    try {
      // 1. TS Compiler API からホバー先の情報を取得 (QuickInfo)
      const info = this.#env.languageService.getQuickInfoAtPosition(uri, offset);
      if (!info) {
        return null;
      } // ホバー情報がない場所（空白など）は null を返す

      // 2. TSが持っている情報を文字列に変換
      const displayString = ts.displayPartsToString(info.displayParts || []);
      const docString = ts.displayPartsToString(info.documentation || []);

      // 3. LSPの Hover フォーマット (Markdown) に変換して返す
      const contents = {
        kind: 'markdown',
        value: [`\`\`\`typescript\n${displayString}\n\`\`\``, docString].filter(Boolean).join('\n\n---\n\n'), // コメント(docString)があれば横線で区切る
      };

      return {
        contents,
        range: {
          start: this.#getLSPPositionFromOffset(uri, info.textSpan.start),
          end: this.#getLSPPositionFromOffset(uri, info.textSpan.start + info.textSpan.length),
        },
      };
    } catch (e) {
      postLog(`Hover error: ${e.message}`, 1);
      return null;
    }
  }

  // --- ハンドラ: Diagnostics (エラー診断) の実行と送信 ---
  #publishDiagnostics(uri) {
    try {
      // 構文エラー(Syntactic)と意味的エラー(Semantic)の両方を取得
      const syntactic = this.#env.languageService.getSyntacticDiagnostics(uri);
      const semantic = this.#env.languageService.getSemanticDiagnostics(uri);
      const tsDiagnostics = [...syntactic, ...semantic];

      const diagnostics = tsDiagnostics.map((diag) => {
        // エラー位置の計算（開始位置と終了位置）
        // const start = this.#getLSPPositionFromOffset(uri, diag.start || 0);
        // const end = this.#getLSPPositionFromOffset(
        //   uri,
        //   (diag.start || 0) + (diag.length || 0),
        // );
        const startOffset = diag.start ?? 0;
        const endOffset = startOffset + (diag.length ?? 0);
        const start = this.#getLSPPositionFromOffset(uri, startOffset);
        const end = this.#getLSPPositionFromOffset(uri, endOffset);

        return {
          range: { start, end },
          severity: this.#getDiagnosticSeverity(diag.category),
          source: 'typescript',
          // メッセージが入れ子になっている場合を考慮して平坦化
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
        };
      });

      // クライアント(CodeMirror)へ通知をPushする
      self.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: {
          uri,
          diagnostics,
        },
      });
      postLog(`Published ${diagnostics.length} diagnostics for ${uri}`, 4);
    } catch (e) {
      postLog(`Diagnostics error: ${e.message}`, 1);
    }
  }

  // デバウンス処理付きのトリガー
  #triggerDiagnostics(uri) {
    if (this.#documentTimers.has(uri)) {
      clearTimeout(this.#documentTimers.get(uri));
    }
    // 300ms 入力がなければ診断を実行
    const timer = setTimeout(() => {
      this.#publishDiagnostics(uri);
      this.#documentTimers.delete(uri);
    }, 300);
    this.#documentTimers.set(uri, timer);
  }

  async #init() {
    this.#envId++;
    postLog(`VfsCore init start (env #${this.#envId})`);

    // 共通の compilerOptions を使用
    this.#fsMap = await this.#createDefaultMapWithRetry();
    this.#system = tsvfs.createSystem(this.#fsMap);

    // 共通の compilerOptions を使用
    this.#env = tsvfs.createVirtualTypeScriptEnvironment(this.#system, [], ts, this.#compilerOptions);

    this.#ready = true;
    postLog(`VfsCore init complete (env #${this.#envId})`);
  }

  async #createDefaultMapWithRetry(retryCount = 3, perAttemptTimeoutMs = 8000) {
    let lastError = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      postLog(`VFS lib fetch attempt ${attempt}/${retryCount}`);

      try {
        const result = await Promise.race([
          tsvfs.createDefaultMapFromCDN(
            this.#compilerOptions, // 共通のオプションを渡す
            ts.version,
            false,
            ts,
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), perAttemptTimeoutMs)),
        ]);

        postLog(`VFS lib fetch success size=${result.size}`);
        return result;
      } catch (err) {
        lastError = err;
        const msg = String(err?.message ?? err);

        if (msg.includes('NetworkError')) {
          postLog('VFS lib fetch network error → abort', 1);
          throw err;
        }

        if (msg.includes('timeout')) {
          postLog('VFS lib fetch timeout → retry with backoff', 2);
          await sleep(1000 * attempt);
          continue;
        }

        postLog(`VFS lib fetch unexpected error: ${msg}`, 1);
        throw err;
      }
    }
    throw lastError || new Error('VFS default map initialization failed');
  }
}

const server = new BrowserLanguageServer();
self.addEventListener('message', async (e) => {
  const response = await server.handleMessage(e.data);
  if (response) {
    self.postMessage(response);
  }
});
