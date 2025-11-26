/// <reference types="vite/client" />

// CSS Modules type declarations
// This tells TypeScript that .module.css files export an object with string keys
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Regular CSS files
declare module '*.css' {
  const content: string;
  export default content;
}
