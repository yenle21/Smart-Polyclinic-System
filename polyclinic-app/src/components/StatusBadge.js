import { View, Text, StyleSheet } from 'react-native';

const CONFIG = {
    unpaid:    { label: 'Chưa thanh toán', bg: '#FEE2E2', color: '#DC2626' },
    paid:      { label: 'Đã thanh toán',   bg: '#D1FAE5', color: '#059669' },
    cancelled: { label: 'Đã hủy',          bg: '#F3F4F6', color: '#6B7280' },
};

export default function StatusBadge({ status }) {
    const c = CONFIG[status] || { label: status, bg: '#F3F4F6', color: '#374151' };
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.text, { color: c.color }]}>{c.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    text:  { fontSize: 11, fontWeight: '600' },
});