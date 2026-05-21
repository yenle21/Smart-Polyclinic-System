import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, ActivityIndicator, Divider } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const PrescriptionDetailScreen = ({ route }) => {
    const { recordId } = route.params || {};
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['prescriptions'], {
                params: { medical_record: recordId }
            });
                const data = Array.isArray(res.data) ? res.data : res.data.results || [];
                setPrescriptions(data);
            } catch (err) {
                console.log('FETCH PRESCRIPTION ERROR:', err.response?.data || err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Đang tải đơn thuốc...</Text>
        </View>
    );

    if (prescriptions.length === 0) return (
        <View style={styles.center}>
            <Text style={styles.empty}>Chưa có đơn thuốc nào</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {prescriptions.map((pres, idx) => (
                <Card key={pres.id} style={styles.card}>
                    <Card.Title
                        title={`💊 Đơn thuốc #${idx + 1}`}
                        titleStyle={{ fontWeight: '700' }}
                    />
                    <Card.Content>
                        {pres.instructions ? (
                            <>
                                <Text style={styles.label}>Hướng dẫn chung</Text>
                                <Text style={styles.value}>{pres.instructions}</Text>
                                <Divider style={{ marginVertical: 10 }} />
                            </>
                        ) : null}

                        {(pres.items || []).map((item, i) => (
                            <View key={i} style={styles.itemBox}>
                                <Text style={styles.medicineName}>
                                    🧪 {item.medicine_name || `Thuốc #${i + 1}`}
                                </Text>
                                <Text style={styles.label}>Số lượng</Text>
                                <Text style={styles.value}>{item.quantity}</Text>
                                <Text style={styles.label}>Liều dùng</Text>
                                <Text style={styles.value}>{item.dosage}</Text>
                                {item.duration_days ? (
                                    <>
                                        <Text style={styles.label}>Số ngày dùng</Text>
                                        <Text style={styles.value}>{item.duration_days} ngày</Text>
                                    </>
                                ) : null}
                                {item.notes ? (
                                    <>
                                        <Text style={styles.label}>Ghi chú</Text>
                                        <Text style={styles.value}>{item.notes}</Text>
                                    </>
                                ) : null}
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
};

export default PrescriptionDetailScreen;

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#F5F6FA', padding: 12 },
    card:         { borderRadius: 16, backgroundColor: '#FFF', marginBottom: 14 },
    itemBox:      { backgroundColor: '#F8F9FF', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E0E7FF' },
    medicineName: { fontSize: 15, fontWeight: '700', color: '#3949AB', marginBottom: 6 },
    label:        { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginTop: 8 },
    value:        { fontSize: 15, color: '#111', marginTop: 2 },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    empty:        { color: '#888', fontSize: 16 },
});