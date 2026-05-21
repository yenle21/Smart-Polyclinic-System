import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';
import { useFocusEffect } from '@react-navigation/native';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function InvoiceListScreen({ navigation }) {
    const [invoices,   setInvoices]   = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInvoices = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['invoices']);
            setInvoices(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [])
    );

    const handlePay = async (id) => {
        try {
            const api = await authApis();
            await api.post(endpoints['pay-invoice'](id));
            fetchInvoices();
        } catch (err) { console.error(err); }
    };
    
    const renderItem = ({ item }) => (
        <Card style={styles.card}
              onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}>
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium" style={styles.name}>
                        #{item.id} — {item.patient_name}
                    </Text>
                    <Chip textStyle={{ fontSize: 11 }}
                        style={{ backgroundColor: item.status === 'paid' ? '#D1FAE5' : '#FEE2E2' }}>
                        {item.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </Chip>
                </View>
                <Text style={styles.info}>💰 {formatMoney(item.total_amount)}</Text>
                <Text style={styles.info}>📅 {item.created_date}</Text>
                {item.status === 'unpaid' && (
                    <Button mode="contained" onPress={() => handlePay(item.id)}
                            style={styles.btn} buttonColor={COLORS.primary}>
                        Xác nhận thanh toán
                    </Button>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />}
                ListEmptyComponent={<Text style={styles.empty}>Không có hóa đơn nào</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list:      { paddingHorizontal: 12, paddingBottom: 20 },
    card:      { marginBottom: 10, borderRadius: 12 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:      { fontWeight: 'bold', flex: 1 },
    info:      { color: COLORS.gray, marginTop: 4, fontSize: 13 },
    btn:       { marginTop: 10, borderRadius: 8 },
    empty:     { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});