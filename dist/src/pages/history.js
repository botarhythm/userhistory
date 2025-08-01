import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const History = ({ userProfile }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    useEffect(() => {
        if (userProfile) {
            fetchHistory();
        }
    }, [userProfile, filterType]);
    const fetchHistory = async () => {
        if (!userProfile)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterType !== 'all') {
                params.append('type', filterType);
            }
            params.append('limit', '50');
            const response = await fetch(`/api/history/${userProfile.userId}?${params}`);
            const result = await response.json();
            if (response.ok) {
                setHistory(result.history || []);
            }
            else {
                setError(result.error || '履歴の取得に失敗しました');
            }
        }
        catch (error) {
            console.error('History fetch error:', error);
            setError('通信エラーが発生しました');
        }
        finally {
            setIsLoading(false);
        }
    };
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const formatItems = (items) => {
        if (!items || items.length === 0)
            return '';
        return items.map(item => `${item.name} x${item.quantity}`).join(', ');
    };
    const getTypeLabel = (type) => {
        return type === 'checkin' ? '来店' : '購入';
    };
    const getTypeColor = (type) => {
        return type === 'checkin'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-blue-100 text-blue-800 border-blue-200';
    };
    if (!userProfile) {
        return (_jsx("div", { className: "max-w-4xl mx-auto", children: _jsx("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: _jsx("div", { className: "text-center text-gray-500", children: "\u30E6\u30FC\u30B6\u30FC\u60C5\u5831\u304C\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093" }) }) }));
    }
    return (_jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "\u5C65\u6B74\u4E00\u89A7" }), _jsx("button", { onClick: fetchHistory, disabled: isLoading, className: "text-blue-600 hover:text-blue-800 disabled:opacity-50", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) })] }) }), _jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: () => setFilterType('all'), className: `px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'all'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\u3059\u3079\u3066" }), _jsx("button", { onClick: () => setFilterType('checkin'), className: `px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'checkin'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\u6765\u5E97" }), _jsx("button", { onClick: () => setFilterType('purchase'), className: `px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'purchase'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\u8CFC\u5165" })] }) }), _jsx("div", { className: "p-6", children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-3 text-gray-600", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })] })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-red-600 mb-4", children: error }), _jsx("button", { onClick: fetchHistory, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700", children: "\u518D\u8A66\u884C" })] })) : history.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-500 mb-4", children: filterType === 'all'
                                    ? '履歴がありません'
                                    : `${getTypeLabel(filterType)}履歴がありません` }), _jsx("p", { className: "text-sm text-gray-400", children: "\u521D\u56DE\u306E\u6765\u5E97\u3084\u8CFC\u5165\u3092\u8A18\u9332\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044" })] })) : (_jsx("div", { className: "space-y-4", children: history.map((record) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(record.type)}`, children: getTypeLabel(record.type) }), _jsx("span", { className: "text-sm text-gray-500", children: formatDate(record.timestamp) })] }), record.type === 'purchase' && (_jsxs("div", { className: "space-y-2", children: [record.items && record.items.length > 0 && (_jsx("div", { className: "text-gray-900", children: formatItems(record.items) })), record.total && (_jsxs("div", { className: "text-lg font-semibold text-blue-600", children: ["\u00A5", record.total.toLocaleString()] }))] })), record.memo && (_jsx("div", { className: "mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded", children: record.memo }))] }) }) }, record.id))) })) })] }) }));
};
export default History;
//# sourceMappingURL=history.js.map