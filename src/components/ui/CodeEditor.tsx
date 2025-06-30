import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
    code: string;
    onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            onChange(value);
        }
    };

    return (
        <div className="h-full bg-gray-950">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    glyphMargin: false,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    tabSize: 2,
                    insertSpaces: true,
                    bracketPairColorization: {
                        enabled: true,
                    },
                    guides: {
                        bracketPairs: true,
                        indentation: true,
                    },
                }}
            />
        </div>
    );
};

export default CodeEditor;
