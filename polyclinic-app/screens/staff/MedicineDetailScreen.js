import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Divider } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function MedicineDetailScreen({ route }) {
    const { id } = route.params;
    const [medicine, setMedicine] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['medicine-detail'](id));
                setMedicine(res.data);
            } catch (err) {
                console.error('fetchMedicine:', err);
            }
        };
        fetch();
    }, [id]);

    if (!medicine) return (
        <View style={styles.center}>
            <Text>Đang tải...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="headlineSmall" style={styles.name}>{medicine.name}</Text>
                        {medicine.stock_quantity <= 10 && (
                            <Chip icon="alert" style={{ backgroundColor: '#FEE2E2' }}
                                  textStyle={{ fontSize: 11, color: COLORS.danger }}>
                                Tồn thấp
                            </Chip>
                        )}
                    </View>
                    <Text style={styles.category}>📂 {medicine.category_name || 'Chưa phân loại'}</Text>
                    <Divider style={styles.divider} />

                    <Row label="Giá bán"      value={formatMoney(medicine.price)} />
                    <Row label="Đơn vị"       value={medicine.unit} />
                    <Row label="Tồn kho"      value={`${medicine.stock_quantity ?? '---'} ${medicine.unit}`} />
                    <Row label="Hoạt chất"    value={medicine.ingredient || '---'} />
                    <Row label="Nhà sản xuất" value={medicine.manufacturer || '---'} />
                    <Row label="Hạn sử dụng"  value={medicine.expiry_date || '---'} />

                    {medicine.description ? (
                        <>
                            <Divider style={styles.divider} />
                            <Text style={styles.label}>Mô tả</Text>
                            <Text style={styles.desc}>{medicine.description}</Text>
                        </>
                    ) : null}
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
});