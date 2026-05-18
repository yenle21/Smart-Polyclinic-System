import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const TYPE_LABEL = {
    import: { label: 'Nhập kho', color: '#10B981' },
    export: { label: 'Xuất kho', color: '#EF4444' },
};

export default function StockTransactionScreen({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [refreshing,   setRefreshing]   = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['stock-transactions']);
            setTransactions(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const renderItem = ({ item }) => {
        const t = TYPE_LABEL[item.transaction_type] || { label: item.transaction_type, color: '#888' };
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="titleMedium" style={styles.name}>{item.medicine_name}</Text>
                        <Chip textStyle={{ color: t.color, fontSize: 11 }}
                              style={{ backgroundColor: t.color + '20' }}>{t.label}</Chip>
                    </View>
                    <Text style={styles.info}>📦 Số lượng: {item.quantity}</Text>
                    <Text style={styles.info}>📅 {item.created_date}</Text>
                    {item.note ? <Text style={styles.info}>📝 {item.note}</Text> : null}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); fetchTransactions(); }} />}
                ListEmptyComponent={<Text style={styles.empty}>Không có giao dịch nào</Text>}
            />
            <FAB icon="plus" style={styles.fab} onPress={() => {}} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list:      { paddingHorizontal: 12, paddingBottom: 80 },
    card:      { marginBottom: 10, borderRadius: 12 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:      { fontWeight: 'bold', flex: 1 },
    info:      { color: COLORS.gray, marginTop: 4, fontSize: 13 },
    empty:     { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
    fab:       { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
});