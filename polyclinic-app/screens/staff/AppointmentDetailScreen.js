import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Card, Text, Chip, Button, Divider } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function PrescriptionDetailScreen() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [refreshing,    setRefreshing]    = useState(false);

    const fetchPrescriptions = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['prescriptions']);
            setPrescriptions(res.data.results || res.data);
        } catch (err) {
            console.error('fetchPrescriptions:', err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

    const handleDispense = async (id) => {
        try {
            const api = await authApis();
            await api.post(endpoints['dispense'](id));
            fetchPrescriptions();
        } catch (err) { console.error(err); }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                {/* Header */}
                <View style={styles.row}>
                    <Text variant="titleMedium" style={styles.name}>
                        {item.patient_name || 'Bệnh nhân'}
                    </Text>
                    <Chip textStyle={{ fontSize: 11 }}
                          style={{ backgroundColor: item.is_dispensed ? '#D1FAE5' : '#FEE2E2' }}>
                        {item.is_dispensed ? '✅ Đã xuất' : '⏳ Chưa xuất'}
                    </Chip>
                </View>

                {/* Thông tin */}
                <Text style={styles.info}>🩺 BS. {item.doctor_name || '---'}</Text>
                <Text style={styles.info}>📅 {item.created_date}</Text>
                {item.instructions &&
                    <Text style={styles.info}>📋 {item.instructions}</Text>}

                {/* Danh sách thuốc — dùng items thay vì medicines */}
                {item.items?.length > 0 && (
                    <>
                        <Divider style={styles.divider} />
                        <Text style={styles.medicineTitle}>Danh sách thuốc:</Text>
                        {item.items.map((m, i) => (
                            <View key={i} style={styles.medicineRow}>
                                <Text style={styles.medicineName}>
                                    💊 {m.medicine_name}
                                </Text>
                                <Text style={styles.medicineInfo}>
                                    {m.quantity} {m.medicine_unit} — {m.dosage}
                                </Text>
                                {m.duration_days &&
                                    <Text style={styles.medicineInfo}>
                                        ⏱ {m.duration_days} ngày
                                    </Text>}
                                {m.notes &&
                                    <Text style={styles.medicineNote}>📝 {m.notes}</Text>}
                            </View>
                        ))}
                        <Divider style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tổng tiền thuốc</Text>
                            <Text style={styles.totalValue}>
                                {formatMoney(item.total_medicine_fee)}
                            </Text>
                        </View>
                    </>
                )}

                {/* Nút xuất thuốc */}
                {!item.is_dispensed && (
                    <Button mode="contained" onPress={() => handleDispense(item.id)}
                            style={styles.btn} buttonColor={COLORS.primary}>
                        Xuất thuốc
                    </Button>
                )}
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={prescriptions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchPrescriptions(); }} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có đơn thuốc nào</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: COLORS.background },
    list:          { paddingHorizontal: 12, paddingBottom: 20 },
    card:          { marginBottom: 10, borderRadius: 12 },
    row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:          { fontWeight: 'bold', flex: 1 },
    info:          { color: COLORS.gray, marginTop: 4, fontSize: 13 },
    divider:       { marginVertical: 10 },
    medicineTitle: { fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
    medicineRow:   { marginBottom: 8, paddingLeft: 4 },
    medicineName:  { color: COLORS.text, fontWeight: '600', fontSize: 13 },
    medicineInfo:  { color: COLORS.gray, fontSize: 12, marginTop: 2 },
    medicineNote:  { color: COLORS.warning, fontSize: 12, marginTop: 2 },
    totalRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel:    { color: COLORS.gray, fontWeight: '600' },
    totalValue:    { color: COLORS.primary, fontWeight: 'bold' },
    btn:           { marginTop: 10, borderRadius: 8 },
    empty:         { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});