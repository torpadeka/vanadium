import React, { useEffect, useRef } from "react";

interface PreviewPaneProps {
    code: string;
    webContainer?: any;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ code, webContainer }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!webContainer || isInitialized.current || !webContainer.fs) return;

        const initializeWebContainerPreview = async () => {
            try {
                isInitialized.current = true;

                const filesToWrite = [
                    { name: "src/App.jsx", content: code },
                    {
                        name: "src/main.jsx",
                        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
                    },
                    {
                        name: "index.html",
                        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
                    },
                    {
                        name: "src/index.css",
                        content: `:root { font-family: sans-serif; } body { margin: 0; } #root { padding: 20px; }`,
                    },
                ];
                for (const file of filesToWrite) {
                    await webContainer.fs.writeFile(file.name, file.content);
                    console.log(`Wrote ${file.name} to WebContainer`);
                }

                console.log("Checking dependencies...");
                const installProcess = await webContainer.spawn("npm", [
                    "install",
                ]);
                const installOutput = await new Promise<string>((resolve) => {
                    let output = "";
                    installProcess.output.pipeTo(
                        new WritableStream({
                            write(data) {
                                output += data.toString();
                            },
                            close() {
                                resolve(output);
                            },
                        })
                    );
                });
                console.log("Dependencies installed output:", installOutput);

                const process = await webContainer.spawn(
                    "npm",
                    ["run", "dev"],
                    {
                        terminal: { cols: 80, rows: 24 },
                    }
                );
                process.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            const output = data.toString();
                            console.log("Vite output:", output);
                            const match = output.match(
                                /http:\/\/localhost:(\d+)/
                            );
                            if (match) {
                                const port = match[1];
                                const stackblitzUrl = `https://gqihe0qvkkdzfnah0h6udm3jh3nlo3-1tnf-xh293q5f.w-corp-staticblitz.com/preview?port=${port}`;
                                iframeRef.current!.src = stackblitzUrl;
                            } else if (output.includes("command not found")) {
                                console.error(
                                    "Vite command failed, falling back to iframe"
                                );
                                initializeIframePreview();
                            }
                        },
                    })
                );
            } catch (error) {
                console.error(
                    "Failed to initialize WebContainer preview:",
                    error
                );
                initializeIframePreview();
            }
        };

        const initializeIframePreview = () => {
            if (!iframeRef.current) return;

            const iframe = iframeRef.current;
            const doc = iframe.contentDocument;

            if (!doc) return;

            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: sans-serif; }
    #root { padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;

            doc.open();
            doc.write(htmlContent);
            doc.close();
        };

        if (webContainer) {
            initializeWebContainerPreview();
        } else {
            initializeIframePreview();
        }
    }, [code, webContainer]);

    return (
        <div className="h-full bg-white relative">
            <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts"
            />
            {!webContainer && (
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Iframe Preview
                </div>
            )}
        </div>
    );
};

export default PreviewPane;
