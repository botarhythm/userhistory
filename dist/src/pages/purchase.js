import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const Purchase = ({ userProfile }) => {
    const [items, setItems] = useState([
        { name: '', quantity: 1, price: 0 }
    ]);
    const [memo, setMemo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const addItem = () => {
        setItems([...items, { name: '', quantity: 1, price: 0 }]);
    };
    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };
    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userProfile) {
            setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
            return;
        }
        // バリデーション
        const validItems = items.filter(item => item.name.trim() && item.price > 0);
        if (validItems.length === 0) {
            setMessage({ type: 'error', text: '商品名と価格を入力してください' });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);
        try {
            const response = await fetch('/api/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lineUid: userProfile.userId,
                    displayName: userProfile.displayName,
                    items: validItems,
                    total: calculateTotal(),
                    memo: memo.trim() || undefined,
                    timestamp: new Date().toISOString()
                }),
            });
            const result = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: '購入履歴を記録しました！' });
                setItems([{ name: '', quantity: 1, price: 0 }]);
                setMemo('');
            }
            else {
                setMessage({ type: 'error', text: result.error || 'エラーが発生しました' });
            }
        }
        catch (error) {
            console.error('Purchase submission error:', error);
            setMessage({ type: 'error', text: '通信エラーが発生しました' });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "\u8CFC\u5165\u5C65\u6B74\u3092\u8A18\u9332" }), message && (_jsx("div", { className: `mb-4 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'}`, children: message.text })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "\u5546\u54C1" }), _jsx("div", { className: "space-y-4", children: items.map((item, index) => (_jsxs("div", { className: "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", placeholder: "\u5546\u54C1\u540D", value: item.name, onChange: (e) => updateItem(index, 'name', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true }) }), _jsx("div", { className: "w-24", children: _jsx("input", { type: "number", placeholder: "\u6570\u91CF", value: item.quantity, onChange: (e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1), min: "1", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }) }), _jsx("div", { className: "w-32", children: _jsx("input", { type: "number", placeholder: "\u4FA1\u683C", value: item.price, onChange: (e) => updateItem(index, 'price', parseInt(e.target.value) || 0), min: "0", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }) }), _jsx("div", { className: "w-20 text-right", children: _jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["\u00A5", (item.price * item.quantity).toLocaleString()] }) }), items.length > 1 && (_jsx("button", { type: "button", onClick: () => removeItem(index), className: "text-red-500 hover:text-red-700", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) }))] }, index))) }), _jsxs("button", { type: "button", onClick: addItem, className: "mt-4 flex items-center text-blue-600 hover:text-blue-800", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }), "\u5546\u54C1\u3092\u8FFD\u52A0"] })] }), _jsx("div", { className: "border-t pt-4", children: _jsxs("div", { className: "flex justify-between items-center text-lg font-bold", children: [_jsx("span", { children: "\u5408\u8A08" }), _jsxs("span", { className: "text-2xl text-blue-600", children: ["\u00A5", calculateTotal().toLocaleString()] })] }) }), _jsxs("div", { children: [_jsx("label", { htmlFor: "memo", className: "block text-sm font-medium text-gray-700 mb-2", children: "\u30E1\u30E2\uFF08\u4EFB\u610F\uFF09" }), _jsx("textarea", { id: "memo", value: memo, onChange: (e) => setMemo(e.target.value), rows: 3, placeholder: "\u7279\u8A18\u4E8B\u9805\u304C\u3042\u308C\u3070\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" }), "\u9001\u4FE1\u4E2D..."] })) : ('購入履歴を記録') })] })] }) }));
};
export default Purchase;
//# sourceMappingURL=purchase.js.map