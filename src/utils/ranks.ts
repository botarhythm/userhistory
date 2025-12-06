export const MEMBER_RANKS = [
    { name: 'BRONZE', min: 0, color: 'from-orange-400 to-orange-600', badgeBorder: 'border-orange-200', text: 'text-orange-100', colorCode: '#F97316' }, // colorCode for simple UI badges
    { name: 'SILVER', min: 30, color: 'from-slate-300 to-slate-400', badgeBorder: 'border-slate-200', text: 'text-slate-100', colorCode: '#94A3B8' },
    { name: 'GOLD', min: 60, color: 'from-yellow-400 to-yellow-600', badgeBorder: 'border-yellow-200', text: 'text-yellow-100', colorCode: '#EAB308' },
    { name: 'PLATINUM', min: 90, color: 'from-cyan-400 to-cyan-600', badgeBorder: 'border-cyan-200', text: 'text-cyan-100', colorCode: '#06B6D4' },
    { name: 'BLACK', min: 120, color: 'from-gray-800 to-black', badgeBorder: 'border-gray-500', text: 'text-gray-300', colorCode: '#1F2937' }
];

export const getRank = (totalPoints: number) => {
    // Find highest rank where min <= totalPoints
    const sortedRanks = [...MEMBER_RANKS].sort((a, b) => b.min - a.min);
    return sortedRanks.find(r => totalPoints >= r.min) || MEMBER_RANKS[0]; // Default to Bronze
};
