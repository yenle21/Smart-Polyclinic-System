import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Button, Divider } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';
import { useFocusEffect } from '@react-navigation/native';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('vi-VN');

export default function PrescriptionDetailScreen({ route, navigation }) {
    const { id } = route.params;  // ← đổi prescription thành id
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetch = async () => {
                try {
                    const api = await authApis();
                    const res = await api.get(`${endpoints['prescriptions']}${id}/`);
                    setPrescription(res.data);
                } catch (err) {
                    console.error('fetch error:', err.response?.status, err.config?.url);
                }
            };
            fetch();
        }, [id])
    );

    const handleDispense = async () => {
        try {
            setLoading(true);
            const api = await authApis();
            await api.post(endpoints['dispense'](id)); 
            setPrescription(prev => ({ ...prev, is_dispensed: true }));
            navigation.replace('PrescriptionList');
        } catch (err) {
            console.error('dispense error:', err.response?.status, err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    if (!prescription) return (
        <View style={styles.center}><Text>Đang tải...</Text></View>
    );
    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    {/* Header */}
                    <View style={styles.row}>
                        <Text variant="titleLarge" style={styles.title}>
                            Đơn thuốc #{prescription.id}
                        </Text>
                        <Chip textStyle={{ fontSize: 11 }}
                              style={{ backgroundColor: prescription.is_dispensed ? '#D1FAE5' : '#FEE2E2' }}>
                            {prescription.is_dispensed ? '✅ Đã xuất' : '⏳ Chưa xuất'}
                        </Chip>
                    </View>

                    {/* Thông tin */}
                    <Divider style={styles.divider} />
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                    <Row label="Bệnh nhân" value={prescription.patient_name} />
                    <Row label="Bác sĩ"    value={`BS. ${prescription.doctor_name}`} />
                    <Row label="Ngày tạo"  value={formatDate(prescription.created_date)} />
                    {prescription.instructions && (
                        <>
                            <Text style={styles.label}>Hướng dẫn</Text>
                            <Text style={styles.desc}>{prescription.instructions}</Text>
                        </>
                    )}

                    {/* Danh sách thuốc */}
                    <Divider style={styles.divider} />
                    <Text style={styles.sectionTitle}>
                        Danh sách thuốc ({prescription.items?.length || 0} loại)
                    </Text>
                    {prescription.items?.map((m) => (
                        <View key={m.id} style={styles.medicineCard}>
                            <View style={styles.medicineHeader}>
                                <Text style={styles.medicineName}>💊 {m.medicine_name}</Text>
                                <Text style={styles.medicineQty}>
                                    x{m.quantity} {m.medicine_unit}
                                </Text>
                            </View>
                            <Text style={styles.medicineInfo}>📋 {m.dosage}</Text>
                            <Text style={styles.medicineInfo}>⏱ {m.duration_days} ngày</Text>
                            {m.notes &&
                                <Text style={styles.medicineNote}>📝 {m.notes}</Text>}
                        </View>
                    ))}

                    {/* Tổng tiền */}
                    <Divider style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                            Tổng tiền thuốc
                        </Text>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: COLORS.primary }}>
                            {formatMoney(prescription.total_medicine_fee)}
                        </Text>
                    </View>

                    {/* Nút xuất thuốc */}
                    {!prescription.is_dispensed && (
                        <Button mode="contained" onPress={handleDispense}
                                loading={loading} disabled={loading}
                                style={styles.btn} buttonColor={COLORS.primary}>
                            Xuất thuốc
                        </Button>
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

function Row({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: COLORS.background },
    card:          { margin: 12, borderRadius: 12 },
    row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:         { fontWeight: 'bold', flex: 1 },
    divider:       { marginVertical: 12 },
    sectionTitle:  { fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    infoRow:       { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    label:         { color: COLORS.gray, fontSize: 13 },
    value:         { color: COLORS.text, fontWeight: '500', fontSize: 13 },
    desc:          { color: COLORS.text, lineHeight: 20, marginTop: 4 },
    medicineCard:  { backgroundColor: COLORS.lightGray, borderRadius: 8,
                     padding: 10, marginBottom: 8 },
    medicineHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    medicineName:  { color: COLORS.text, fontWeight: '600', fontSize: 14, flex: 1 },
    medicineQty:   { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
    medicineInfo:  { color: COLORS.gray, fontSize: 12, marginTop: 4 },
    medicineNote:  { color: COLORS.warning, fontSize: 12, marginTop: 4 },
    totalRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    btn:           { marginTop: 12, borderRadius: 8 },
});