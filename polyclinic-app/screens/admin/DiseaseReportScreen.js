// screens/admin/DiseaseReportScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const COLORS_LIST = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6',
                     '#EC4899','#14B8A6','#F97316','#8B5CF6','#06B6D4'];

function RankRow({ rank, label, value, unit, max, color }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <View style={styles.rankRow}>
            <View style={[styles.rankBadge, { backgroundColor: color + '22' }]}>
                <Text style={[styles.rankNum, { color }]}>#{rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.rankLabel} numberOfLines={2}>{label}</Text>
                <View style={styles.rankTrack}>
                    <View style={[styles.rankFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
            </View>
            <Text style={[styles.rankValue, { color }]}>{value} {unit}</Text>
        </View>
    );
}

export default function DiseaseReportScreen() {
    const [data,       setData]       = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['disease-report']);
            setData(res.data);
        } catch (err) {
            console.error('DiseaseReport:', err.response?.data || err.message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (!data) return (
        <View style={styles.center}><Text style={{ color: COLORS.gray }}>Đang tải...</Text></View>
    );

    const maxDiagnosis = Math.max(...(data.by_diagnosis || []).map(d => d.count), 1);
    const maxMedicine  = Math.max(...(data.top_medicines || []).map(m => m.total), 1);

    return (
        <ScrollView style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }} />
                    }>

            {/* Bệnh phổ biến */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>🦠 Bệnh phổ biến trong cộng đồng</Text>
                    {(data.by_diagnosis || []).length === 0
                        ? <Text style={styles.empty}>Không có dữ liệu</Text>
                        : (data.by_diagnosis || []).map((d, i) => (
                            <RankRow key={i} rank={i + 1}
                                     label={d.diagnosis}
                                     value={d.count} unit="ca"
                                     max={maxDiagnosis}
                                     color={COLORS_LIST[i % COLORS_LIST.length]} />
                        ))
                    }
                </Card.Content>
            </Card>

            {/* Thuốc kê nhiều nhất */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>💊 Thuốc được kê nhiều nhất</Text>
                    {(data.top_medicines || []).length === 0
                        ? <Text style={styles.empty}>Không có dữ liệu</Text>
                        : (data.top_medicines || []).map((m, i) => (
                            <RankRow key={i} rank={i + 1}
                                     label={m.medicine__name || '—'}
                                     value={m.total} unit="đơn vị"
                                     max={maxMedicine}
                                     color={COLORS_LIST[i % COLORS_LIST.length]} />
                        ))
                    }
                </Card.Content>
            </Card>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: COLORS.background },
    center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card:       { marginHorizontal: 12, marginTop: 12, borderRadius: 12 },
    cardTitle:  { fontWeight: 'bold', fontSize: 14, color: COLORS.text, marginBottom: 12 },
    rankRow:    { flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 8, gap: 10,
                  borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    rankBadge:  { width: 36, height: 36, borderRadius: 18,
                  justifyContent: 'center', alignItems: 'center' },
    rankNum:    { fontWeight: 'bold', fontSize: 13 },
    rankLabel:  { fontSize: 13, color: COLORS.text, marginBottom: 4 },
    rankTrack:  { backgroundColor: '#E5E7EB', borderRadius: 4, height: 6 },
    rankFill:   { height: 6, borderRadius: 4, minWidth: 4 },
    rankValue:  { width: 70, fontSize: 12, fontWeight: 'bold', textAlign: 'right' },
    empty:      { color: COLORS.gray, textAlign: 'center', marginVertical: 12 },
});