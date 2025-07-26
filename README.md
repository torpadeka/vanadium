# Vanadium

**A WHCL competition project by Team Celestium.**

Vanadium is a revolutionary, AI-powered development environment designed to streamline the creation of Vite + React web applications. It features **z9**, a sophisticated AI agent that assists developers by generating, modifying, and refactoring code in real-time. Built on the **Internet Computer Protocol (ICP)**, Vanadium ensures robust security, transparency, and decentralization.

---

## 🚀 Core Features

Vanadium integrates an AI assistant, a live development server, and a code editor into one seamless experience, allowing developers to go from idea to full-stack dApp in minutes.

* **🤖 AI-Powered Development**: Interact with z9, our AI agent, to generate components, add features, and modify your project using natural language prompts.
* **⚡ Real-Time Live Preview**: Instantly see your changes reflected in a live preview environment, powered by WebContainers, directly within the platform.
* **📝 Integrated Code Editor**: Access and edit your project's code with an integrated Monaco Editor, providing a familiar and powerful coding experience.
* **🎨 Visual Prompting with Canvas (WIP)**: Use the innovative Canvas feature to draw directly on the UI preview, showing the AI exactly where you want to make changes.
* **🔒 Blockchain Security**: Leveraging the Internet Computer Protocol (ICP) and Motoko, Vanadium provides a secure, transparent, and decentralized backend for your applications.
* **📂 Full Project Management**: Manage your project's files and versions with an intuitive chat-based interface.

---

## 🛠️ Tech Stack

Vanadium is built with a modern, robust, and scalable technology stack to deliver a top-tier developer experience.

| Category | Technology |
| :--- | :--- |
| **Frontend** | [**Vite**](https://vitejs.dev/), [**React**](https://react.dev/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **Backend** | [**Internet Computer (ICP)**](https://internetcomputer.org/), [**Motoko**](https://internetcomputer.org/docs/current/motoko/main/motoko) |
| **AI Agent** | [**Azure AI Services**](https://azure.microsoft.com/en-us/products/ai-services) |
| **Core UI** | [**shadcn/ui**](https://ui.shadcn.com/), [**Lucide React**](https://lucide.dev/), [**Framer Motion**](https://www.framer.com/motion/) |

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v16.x or later)
* [DFINITY Canister SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/torpadeka/vanadium.git
    cd vanadium
    ```

2.  **Install dependencies, initial setup and deploying canisters:**
    ```sh
    npm run setup
    ```

3.  **Start the local frontend development server:**
    This will start the Vite frontend development server (HMR supported) concurrently.
    ```sh
    npm run frontend
    ```

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
