"use client";

import { Editor } from "@monaco-editor/react";
import { useCallback, useState } from "react";
import SSE from "./sse";
import { SparklesIcon } from "@heroicons/react/24/outline";

const DEFAULT_HBS = `<div class="entry">\n\t{{#if author}}\n\t\t<h1>{{firstName}} {{lastName}}</h1>\n\t{{/if}}\n</div>\n`;

const MONACO_OPTIONS = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  fontSize: 17,
  minimap: { enabled: false },
  wordWrap: "on",
  lineNumbersMinChars: 2,
};

const OUTPUT_MONACO_OPTIONS = {
  readonly: true,
  ...MONACO_OPTIONS,
};

export default function Home() {
  const [hbsCode, setHbsCode] = useState(DEFAULT_HBS);
  const [reactOutput, setReactOutput] = useState("");
  const [isCoverting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    let payload = JSON.stringify({ params: { handlebars: hbsCode } });
    let sse = new SSE("/api/convert", {
      method: "POST",
      payload,
    });

    setReactOutput("");
    setError(null);

    sse.addEventListener("error", (event: any) => {
      console.error("SSE error", event);
      setError(`Convert error: ${JSON.stringify(event)}`);
      setConverting(false);
    });

    sse.addEventListener("message", (event: any) => {
      if (event.data) {
        let d: any = JSON.parse(event.data);

        if (d.done) {
          setConverting(false);
          sse.close();
          return;
        }

        if (d.text && d.hidden !== true) {
          setReactOutput((prev) => prev + d.text);
        }
      }
    });

    setConverting(true);
    sse.stream();
  }, [hbsCode, reactOutput, setReactOutput, setError]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="pt-4 pl-4 text-xl font-bold font-mono">hbs2react</div>
      <div className="flex-1 flex space-x-4 p-4">
        <div className="flex-1 text-left border border-red-500">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="handlebars"
            value={hbsCode}
            onChange={(value) => {
              if (value) {
                setHbsCode(value);
              }
            }}
            //@ts-ignore
            options={MONACO_OPTIONS}
          />
        </div>
        <div className="flex-1 text-left border border-green-500">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            value={reactOutput}
            //@ts-ignore
            options={OUTPUT_MONACO_OPTIONS}
          />
        </div>
      </div>
      <div className="p-8 border border-blue-500 flex">
        <div>Powered by Mixlayer</div>
        <div className="flex-1"></div>
        <div>
          {!isCoverting && (
            <button
              onClick={convert}
              className="group flex h-min items-center disabled:opacity-50 justify-center ring-none rounded-lg shadow-lg font-semibold py-2 px-4 font-dm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-red-500 border-b-red-700  ring-white text-white border-b-4  active:bg-red-800 active:text-gray-300 focus-visible:outline-red-500 text-sm sm:text-base dark:bg-gray-700 dark:border-gray-700 dark:border-b-gray-900"
            >
              <SparklesIcon className="w-6 mr-2" />
              <span className="text-lg">Convert</span>
            </button>
          )}

          {isCoverting && <div>Converting...</div>}
          {error && (
            <div className="text-red-500">Convert error, check console</div>
          )}
        </div>
      </div>
    </div>
  );
}
