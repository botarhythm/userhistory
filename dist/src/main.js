"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const App_1 = __importDefault(require("./App"));
require("./styles/tailwind.css");
const container = document.getElementById("root");
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render(<App_1.default />);
}
else {
    console.error("root要素が見つかりません");
}
//# sourceMappingURL=main.js.map