import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function InvoiceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['invoice-detail'](id));
                setInvoice(res.data);
            } catch (err) {
                console.error('fetchInvoice:', err);
            }
        };
        fetch();
    }, [id]);

    const handlePay = async () => {
        try {
            const api = await authApis();
            await api.post(endpoints['pay-invoice'](id));
            navigation.goBack();
        } catch (err) { console.error(err); }
    };

    if (!invoice) return (
        <View style={styles.center}><Text>Đang tải...</Text></View>
    );

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="titleLarge" style={styles.title}>Hóa đơn #{invoice.id}</Text>
                        <Chip style={{ backgroundColor: invoice.is_paid ? '#D1FAE5' : '#FEE2E2' }}
                              textStyle={{ fontSize: 11 }}>
                            {invoice.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Chip>
                    </View>

                    <Divider style={styles.divider} />
                    <Text style={styles.label}>Bệnh nhân</Text>
                    <Text style={styles.value}>{invoice.patient_name}</Text>
                    <Text style={styles.label}>Ngày tạo</Text>
                    <Text style={styles.value}>{invoice.created_date}</Text>

                    <Divider style={styles.divider} />
                    <Text variant="titleMedium" style={styles.subtitle}>Chi tiết dịch vụ</Text>
                    {invoice.items?.map((item, i) => (
                        <View key={i} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.service_name || item.name}</Text>
                            <Text style={styles.itemPrice}>{formatMoney(item.amount)}</Text>
                        </View>
                    ))}

                    <Divider style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Tổng cộng</Text>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: COLORS.primary }}>
                            {formatMoney(invoice.total_amount)}
                        </Text>
                    </View>

                    {!invoice.is_paid && (
                        <Button mode="contained" onPress={handlePay}
                                style={styles.btn} buttonColor={COLORS.primary}>
                            Xác nhận thanh toán
                        </Button>
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card:      { margin: 12, borderRadius: 12 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:     { fontWeight: 'bold', flex: 1 },
    divider:   { marginVertical: 12 },
    label:     { color: COLORS.gray, fontSize: 12, marginTop: 8 },
    value:     { color: COLORS.text, fontSize: 15, fontWeight: '500' },
    subtitle:  { fontWeight: 'bold', marginBottom: 8 },
    itemRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    itemName:  { color: COLORS.text, flex: 1 },
    itemPrice: { color: COLORS.primary, fontWeight: '600' },
    totalRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    btn:       { marginTop: 16, borderRadius: 8 },
});