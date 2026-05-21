import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';
import { useFocusEffect } from '@react-navigation/native';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('vi-VN');

export default function PrescriptionScreen({ navigation }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [refreshing,    setRefreshing]    = useState(false);

    const fetchPrescriptions = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['prescriptions']);
            setPrescriptions(res.data.results || res.data);
        } catch (err) {
            console.error('fetchPrescriptions:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPrescriptions();
        }, [])
    );

    const renderItem = ({ item }) => (
        <Card style={styles.card}
              onPress={() => navigation.navigate('PrescriptionDetail', { id: item.id })}>
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium" style={styles.name}>
                        {item.patient_name || 'Chưa có tên'}
                    </Text>
                    <Chip textStyle={{ fontSize: 11 }}
                          style={{ backgroundColor: item.is_dispensed ? '#D1FAE5' : '#FEE2E2' }}>
                        {item.is_dispensed ? '✅ Đã xuất' : '⏳ Chưa xuất'}
                    </Chip>
                </View>
                <Text style={styles.info}>🩺 BS. {item.doctor_name}</Text>
                <Text style={styles.info}>💊 {item.items?.length || 0} loại thuốc</Text>
                <Text style={styles.info}>📅 {formatDate(item.created_date)}</Text>
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchPrescriptions(); }}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có đơn thuốc nào</Text>
                }
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
    empty:     { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});