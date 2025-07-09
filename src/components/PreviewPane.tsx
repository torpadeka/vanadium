import React, { useEffect, useRef } from "react";

interface PreviewPaneProps {
    code: string;
    webContainer?: any;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ code, webContainer }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Use WebContainer if available, otherwise fallback to iframe
        if (webContainer) {
            initializeWebContainerPreview();
        } else {
            initializeIframePreview();
        }
    }, [code, webContainer]);

    const initializeWebContainerPreview = async () => {
        if (!webContainer) return;
        
        try {
            // TODO: Implement WebContainer-based preview
            // For now, fallback to iframe
            initializeIframePreview();
        } catch (error) {
            console.warn("WebContainer preview failed, falling back to iframe:", error);
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
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f5f5f5;
    }
    .App {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .App-header {
      background-color: #282c34;
      padding: 20px;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .App-header h1 {
      margin: 0 0 10px 0;
      font-size: 2rem;
    }
    .App-header p {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${code}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (error) {
      document.getElementById('root').innerHTML = \`
        <div style="padding: 20px; color: #d32f2f; background: #ffebee; border: 1px solid #f8bbd9; border-radius: 4px; margin: 20px;">
          <h3>Error in your code:</h3>
          <pre style="white-space: pre-wrap; font-family: monospace; background: #fff; padding: 10px; border-radius: 4px;">\${error.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;

        doc.open();
        doc.write(htmlContent);
        doc.close();
    };

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
