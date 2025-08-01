import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(_jsx(App, {}));
}
else {
    console.error("root要素が見つかりません");
}
