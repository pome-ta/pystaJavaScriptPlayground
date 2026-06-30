import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascriptLanguage } from '@codemirror/lang-javascript';

import { LSPClient, languageServerExtensions } from '@codemirror/lsp-client';
//import { createWorkerTransport } from "./WorkerTransport.js";

/**
 * @param {Worker} worker
 * @returns {import("@codemirror/lsp-client").Transport}
 */
export function createWorkerTransport(worker) {
  const subscribers = new Set();

  worker.addEventListener('message', ({ data }) => {
    subscribers.forEach((subscriber) => {
      subscriber(JSON.stringify(data));
    });
  });

  return {
    send(message) {
      worker.postMessage(JSON.parse(message));
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);
    },

    unsubscribe(subscriber) {
      subscribers.delete(subscriber);
    },
  };
}

const worker = new Worker('./worker.js', {
  type: 'module',
});

const transport = createWorkerTransport(worker);

const client = new LSPClient({
  extensions: languageServerExtensions(),
}).connect(transport);

const editor = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [basicSetup, javascriptLanguage, client.plugin('file:///main.ts')],
  }),
  parent: document.body,
});
