"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const liff_1 = __importDefault(require("@line/liff"));
const purchase_1 = __importDefault(require("./pages/purchase"));
const history_1 = __importDefault(require("./pages/history"));
const App = () => {
    (0, react_1.useEffect)(() => {
        console.log('liff object:', liff_1.default);
        const liffId = (import.meta.env.VITE_LIFF_ID || '').trim();
        console.log('VITE_LIFF_ID:', liffId);
        window.liffInitPromise = (async () => {
            try {
                await liff_1.default.init({ liffId });
                console.log("LIFF initialized successfully");
                if (!liff_1.default.isLoggedIn()) {
                    liff_1.default.login();
                }
            }
            catch (error) {
                console.error("LIFF initialization failed", error);
                alert("LIFF初期化エラー: " + (error instanceof Error ? error.message : String(error)));
            }
        })();
    }, []);
    return (<react_router_dom_1.BrowserRouter>
      <nav className="flex justify-center gap-4 py-4 bg-white shadow">
        <react_router_dom_1.Link to="/purchase" className="px-4 py-2 rounded hover:bg-blue-100">購入履歴</react_router_dom_1.Link>
        <react_router_dom_1.Link to="/history" className="px-4 py-2 rounded hover:bg-gray-100">履歴一覧</react_router_dom_1.Link>
      </nav>
      <react_router_dom_1.Routes>
        <react_router_dom_1.Route path="/purchase" element={<purchase_1.default />}/>
        <react_router_dom_1.Route path="/history" element={<history_1.default />}/>
        <react_router_dom_1.Route path="*" element={<purchase_1.default />}/>
      </react_router_dom_1.Routes>
    </react_router_dom_1.BrowserRouter>);
};
exports.default = App;
//# sourceMappingURL=App.js.map