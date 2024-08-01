"use client";

import { Editor } from "@monaco-editor/react";
import { read } from "fs";
import { useCallback, useState } from "react";
import SSE from "./sse";

const DEFAULT_HBS = `<div class="entry">\n\t{{#if author}}\n\t\t<h1>{{firstName}} {{lastName}}</h1>\n\t{{/if}}\n</div>\n`;

const MONACO_OPTIONS = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  fontSize: 17,
  minimap: { enabled: false },
  lineNumbersMinChars: 2,
};

const OUTPUT_MONACO_OPTIONS = {
  readonly: true,
  ...MONACO_OPTIONS,
};

export default function Home() {
  const [reactOutput, setReactOutput] = useState("");
  const [isCoverting, setConverting] = useState(false);

  const convert = useCallback(() => {
    let sse = new SSE("/api/convert", { method: "POST" });

    setReactOutput("");
    let appending = false;
    let buffer = "";
    sse.addEventListener("message", (event: any) => {
      if (event.data) {
        console.log("event", event);
        let d: any = JSON.parse(event.data);

        if (d.done) {
          setConverting(false);
          sse.close();
          return;
        }

        if (d.text) {
          buffer = buffer + d.text;

          if (appending && d.text == "``") {
            appending = false;
          }

          if (appending) {
            console.log("appending", JSON.stringify(d.text));
            setReactOutput((prev) => prev + d.text);
          }

          // TODO remove this hack after mixlayer supports hidden tokens
          if (buffer.trimEnd().endsWith("```jsx")) {
            appending = true;
          }
        }
      }
    });

    setConverting(true);
    sse.stream();
  }, [reactOutput, setReactOutput]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="pt-4 pl-4 text-xl font-bold font-mono">hbs2react</div>
      <div className="flex-1 flex space-x-4 p-4">
        <div className="flex-1 text-left border border-red-500">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="handlebars"
            value={DEFAULT_HBS}
            options={MONACO_OPTIONS}
          />
        </div>
        <div className="flex-1 text-left border border-green-500">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            value={reactOutput}
            options={OUTPUT_MONACO_OPTIONS}
          />
        </div>
      </div>
      <div className="p-8 border border-blue-500 flex">
        <div>Powered by Mixlayer</div>
        <div className="flex-1"></div>
        <div>
          <button onClick={convert}>Convert</button>
        </div>
      </div>
    </div>
  );
}
