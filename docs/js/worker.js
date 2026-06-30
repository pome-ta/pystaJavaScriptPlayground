import ts from 'https://esm.sh/typescript';
import * as tsvfs from 'https://esm.sh/@typescript/vfs';

function uriToPath(uri) {
  return new URL(uri).pathname;
}

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
};

const fsMap = await tsvfs.createDefaultMapFromCDN(compilerOptions, ts.version, false, ts);

const system = tsvfs.createSystem(fsMap);

const env = tsvfs.createVirtualTypeScriptEnvironment(system, [], ts, compilerOptions);

const handlers = {
  initialize({ id }) {
    reply(id, {
      capabilities: {
        textDocumentSync: 1,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: ['.'],
        },
      },
    });
  },

  initialized() {},

  'textDocument/didOpen'({ params }) {
    const { uri, text } = params.textDocument;
    const path = uriToPath(uri);

    env.createFile(path, text === '' ? '\n' : text);
  },

  'textDocument/didChange'({ params }) {
    const { uri } = params.textDocument;
    const text = params.contentChanges[0].text;

    const path = uriToPath(uri);

    env.updateFile(path, text);
  },

  'textDocument/completion'({ id, params }) {
    const { uri } = params.textDocument;
    const { line, character } = params.position;

    const path = uriToPath(uri);

    const source = env.languageService.getProgram().getSourceFile(path);

    if (!source) {
      reply(id, {
        isIncomplete: false,
        items: [],
      });
      return;
    }

    const offset = ts.getPositionOfLineAndCharacter(source, line, character);

    const result = env.languageService.getCompletionsAtPosition(path, offset, {});

    reply(id, {
      isIncomplete: false,
      items: (result?.entries ?? []).map((entry) => ({
        label: entry.name,
      })),
    });
  },
};

self.addEventListener('message', ({ data }) => {
  const handler = handlers[data.method];

  if (!handler) {
    if (data.id != null) {
      error(data.id, -32601, 'Method not found');
    }
    return;
  }

  handler(data);
});

function reply(id, result) {
  self.postMessage({
    jsonrpc: '2.0',
    id,
    result,
  });
}

function error(id, code, message) {
  self.postMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  });
}
