// Format tiền: 150000 → "150.000đ"
export const formatMoney = (amount) =>
    Number(amount).toLocaleString('vi-VN') + 'đ';

// Format ngày: "2024-01-15" → "15/01/2024"
export const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('vi-VN');

// Format ngày giờ: "2024-01-15T10:30" → "10:30 - 15/01/2024"
export const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`;
};