import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TextInput as RNInput } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const TYPE_LABEL = {
    import: { label: 'Nhập kho',    color: '#10B981' },
    export: { label: 'Xuất kho',    color: '#EF4444' },
    adjust: { label: 'Điều chỉnh', color: '#F59E0B' },
};

const FILTERS = [
    { label: 'Tất cả',     value: '' },
    { label: 'Nhập kho',   value: 'import' },
    { label: 'Xuất kho',   value: 'export' },
    { label: 'Điều chỉnh', value: 'adjust' },
];

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

export default function StockTransactionScreen({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [filtered,     setFiltered]     = useState([]);
    const [refreshing,   setRefreshing]   = useState(false);
    const [search,       setSearch]       = useState('');
    const [activeFilter, setActiveFilter] = useState('');

    const fetchTransactions = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['stock-transactions']);
            const data = res.data.results || res.data;
            setTransactions(data);
            setFiltered(data);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    useEffect(() => {
        let data = transactions;
        if (activeFilter)
            data = data.filter(t => t.transaction_type === activeFilter);
        if (search.trim())
            data = data.filter(t =>
                t.medicine_name?.toLowerCase().includes(search.toLowerCase()));
        setFiltered(data);
    }, [search, activeFilter, transactions]);

    const renderItem = ({ item }) => {
        const t = TYPE_LABEL[item.transaction_type] || { label: item.transaction_type, color: '#888' };
        const sign = item.transaction_type === 'import' ? '+' :
                     item.transaction_type === 'export' ? '-' : '±';
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                            {item.medicine_name}
                        </Text>
                        <Chip textStyle={{ color: t.color, fontSize: 11 }}
                              style={{ backgroundColor: t.color + '20' }}>
                            {t.label}
                        </Chip>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.qty, { color: t.color }]}>
                            {sign}{Math.abs(item.quantity)}
                        </Text>
                        <Text style={styles.date}>📅 {formatDate(item.created_date)}</Text>
                    </View>
                    {item.note ? <Text style={styles.note}>📝 {item.note}</Text> : null}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Tìm kiếm */}
            <View style={styles.searchBox}>
                <RNInput placeholder="🔍 Tìm theo tên thuốc..."
                         value={search} onChangeText={setSearch}
                         style={styles.searchInput}
                         placeholderTextColor={COLORS.gray} />
            </View>

            {/* Filter */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <Chip key={f.value}
                          selected={activeFilter === f.value}
                          onPress={() => setActiveFilter(f.value)}
                          style={[styles.filterChip,
                              activeFilter === f.value && { backgroundColor: COLORS.primary }]}
                          textStyle={{ color: activeFilter === f.value ? '#fff' : COLORS.text,
                                       fontSize: 12 }}>
                        {f.label}
                    </Chip>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchTransactions(); }} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có giao dịch nào</Text>
                }
            />

            {/* FAB → nhập thêm cho thuốc đã có */}
            <FAB icon="plus" label="Nhập kho" style={styles.fab}
                 onPress={() => navigation.navigate('StockForm')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: COLORS.background },
    searchBox:   { margin: 12, marginBottom: 4 },
    searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
                   borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                   fontSize: 14, color: COLORS.text },
    filterRow:   { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
    filterChip:  { borderRadius: 20 },
    list:        { paddingHorizontal: 12, paddingBottom: 100 },
    card:        { marginBottom: 10, borderRadius: 12 },
    row:         { flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'center', marginTop: 4 },
    name:        { fontWeight: 'bold', flex: 1, marginRight: 8 },
    qty:         { fontWeight: 'bold', fontSize: 20 },
    date:        { color: COLORS.gray, fontSize: 12 },
    note:        { color: COLORS.gray, fontSize: 12, marginTop: 4 },
    empty:       { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
    fab:         { position: 'absolute', right: 16, bottom: 16,
                   backgroundColor: COLORS.primary },
});