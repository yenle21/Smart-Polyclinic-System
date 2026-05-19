import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Divider, Button } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const UNIT_MAP = {
    vien: 'Viên',
    chai: 'Chai',
    hop:  'Hộp',
    ong:  'Ống',
    goi:  'Gói',
    ml:   'ml',
    mg:   'mg',
};

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function MedicineDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [medicine, setMedicine] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const fetch = async () => {
                try {
                    const api = await authApis();
                    const res = await api.get(endpoints['medicine-detail'](id));
                    setMedicine(res.data);
                } catch (err) {
                    console.error(err);
                }
            };
            fetch();
        }, [id])
    );

    if (!medicine) return (
        <View style={styles.center}><Text>Đang tải...</Text></View>
    );

    const unitLabel = UNIT_MAP[medicine.unit] || medicine.unit || '---';
    const inv       = medicine.inventory;

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    {/* Tên & danh mục */}
                    <View style={styles.row}>
                        <Text variant="headlineSmall" style={styles.name}>
                            {medicine.name}
                        </Text>
                        {inv?.is_low_stock && (
                            <Chip icon="alert" style={{ backgroundColor: '#FEE2E2' }}
                                  textStyle={{ fontSize: 11, color: COLORS.danger }}>
                                Tồn thấp
                            </Chip>
                        )}
                    </View>
                    <Text style={styles.category}>
                        📂 {medicine.category_name || '---'}
                    </Text>

                    <Divider style={styles.divider} />

                    {/* Thông tin cơ bản */}
                    <Row label="Giá bán"   value={formatMoney(medicine.price)} />
                    <Row label="Đơn vị"    value={unitLabel} />
                    <Row label="Tồn kho"
                         value={inv ? `${inv.quantity} ${unitLabel}` : '---'} />
                    <Row label="Tối thiểu"
                         value={inv ? `${inv.min_quantity} ${unitLabel}` : '---'} />
                    <Row label="Hạn sử dụng"
                         value={inv?.expiry_date || '---'}
                         valueColor={inv?.is_expired ? COLORS.danger : undefined} />
                    <Row label="Còn lại"
                         value={inv ? `${inv.days_until_expiry} ngày` : '---'}
                         valueColor={inv?.is_expired ? COLORS.danger : undefined} />
                    <Row label="Hoạt chất" value={medicine.ingredient || '---'} />

                    {/* Mô tả */}
                    {medicine.description && (
                        <>
                            <Divider style={styles.divider} />
                            <Text style={styles.label}>Mô tả</Text>
                            <Text style={styles.desc}>{medicine.description}</Text>
                        </>
                    )}

                    <Divider style={styles.divider} />

                    {/* Nút sửa */}
                    <Button mode="contained"
                            onPress={() => navigation.navigate('MedicineForm', { medicine })}
                            style={styles.btn} buttonColor={COLORS.primary}>
                        Chỉnh sửa thuốc
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

function Row({ label, value, valueColor }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, valueColor && { color: valueColor }]}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card:      { margin: 12, borderRadius: 12 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:      { fontWeight: 'bold', flex: 1, color: COLORS.text },
    category:  { color: COLORS.gray, marginTop: 4 },
    divider:   { marginVertical: 12 },
    infoRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
    label:     { color: COLORS.gray, fontSize: 13 },
    value:     { color: COLORS.text, fontWeight: '500', fontSize: 13 },
    desc:      { color: COLORS.text, marginTop: 4, lineHeight: 20 },
    btn:       { borderRadius: 8 },
});