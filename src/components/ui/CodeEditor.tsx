import React, { useState, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

// Helper function to determine language from filename extension
const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
        case "js":
            return "javascript";
        case "ts":
        case "tsx":
            return "typescript";
        case "css":
            return "css";
        case "json":
            return "json";
        case "html":
            return "html";
        case "md":
            return "markdown";
        default:
            return "javascript"; // Default fallback language
    }
};

interface CodeEditorProps {
    /** The initial code to display, considered the "saved" version. */
    code: string;
    /** The name of the file, used to infer the language. */
    fileName: string;
    /** Callback function triggered when the user clicks "Save". */
    onSave: (newCode: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, fileName, onSave }) => {
    // Internal state to hold the "draft" or current editor content.
    const [editorContent, setEditorContent] = useState(code);
    const monaco = useMonaco();

    useEffect(() => {
        if (monaco) {
            // 1. Disable validation errors for incorrect paths
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
                {
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                }
            );

            // 2. Set compiler options to support JSX and other modern features
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                // This is the key fix for your JSX error
                jsx: monaco.languages.typescript.JsxEmit.ReactJSX,

                // Other helpful options to make the editor behave more like a modern setup
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            });
        }
    }, [monaco]);

    // Determine if the draft content is different from the saved version.
    const isDirty = editorContent !== code;

    // Determine the language for the editor.
    const language = getLanguageFromFileName(fileName);

    // When the parent component passes a new file's code,
    // we need to update our internal state to reflect that change.
    useEffect(() => {
        setEditorContent(code);
    }, [code, fileName]); // Re-sync if the file or its content changes

    // Update the internal state on every edit.
    const handleEditorChange = (value: string | undefined) => {
        setEditorContent(value || "");
    };

    // Call the parent's onSave function with the current content.
    const handleSave = () => {
        onSave(editorContent);
    };

    return (
        <div className="h-full bg-gray-950 relative">
            <div className="absolute top-2 right-4 z-10 flex items-center space-x-4">
                {isDirty && (
                    <span className="text-sm text-yellow-400">
                        Unsaved Changes
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-4 py-1 text-sm rounded transition-colors ${
                        isDirty
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Save
                </button>
            </div>

            <Editor
                height="100%"
                // Use the dynamically determined language
                language={language}
                // The 'path' prop helps Monaco provide better language-aware features
                path={fileName}
                // The editor's value is now our internal state
                value={editorContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    tabSize: 2,
                }}
            />
        </div>
    );
};

export default CodeEditor;
