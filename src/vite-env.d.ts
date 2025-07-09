/// <reference types="vite/client" />

declare global {
  interface Window {
    __webcontainer_auth_initialized?: boolean;
  }
}

export {};
