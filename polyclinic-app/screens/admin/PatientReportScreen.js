// screens/admin/PatientReportScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const GENDER_LABEL = { male: 'Nam', female: 'Nữ', other: 'Khác' };
const COLORS_LIST = ['#6366F1', '#EC4899', '#10B981', '#F59E0B'];

function BarRow({ label, value, max, color }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <View style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.barValue}>{value}</Text>
        </View>
    );
}

export default function PatientReportScreen() {
    const [data,       setData]       = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['patients-report']);


            setData(res.data);
        } catch (err) {
            console.error('PatientReport:', err.response?.data || err.message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (!data) return (
        <View style={styles.center}><Text style={{ color: COLORS.gray }}>Đang tải...</Text></View>
    );

    const ageEntries    = Object.entries(data.by_age_group || {});
    const maxAge        = Math.max(...ageEntries.map(([, v]) => v), 1);
    const maxSpecialty  = Math.max(...(data.by_specialty || []).map(s => s.count), 1);

    return (
        <ScrollView style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }} />
                    }>

            {/* Tổng quan */}
            <View style={[styles.overviewCard, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.overviewIcon}>👥</Text>
                <Text style={[styles.overviewVal, { color: '#6366F1' }]}>{data.total_patients}</Text>
                <Text style={styles.overviewLabel}>Tổng bệnh nhân</Text>
            </View>

            {/* Theo giới tính */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>⚧ Theo giới tính</Text>
                    <View style={styles.genderRow}>
                        {(data.by_gender || []).map((g, i) => {
                            const total = (data.by_gender || []).reduce((s, x) => s + x.count, 0);
                            const pct   = total > 0 ? ((g.count / total) * 100).toFixed(1) : 0;
                            const color = COLORS_LIST[i % COLORS_LIST.length];
                            return (
                                <View key={i} style={[styles.genderCard, { borderTopColor: color }]}>
                                    <Text style={[styles.genderVal, { color }]}>{g.count}</Text>
                                    <Text style={styles.genderLabel}>
                                        {GENDER_LABEL[g.gender] || g.gender || 'Khác'}
                                    </Text>
                                    <Text style={[styles.genderPct, { color }]}>{pct}%</Text>
                                </View>
                            );
                        })}
                    </View>
                </Card.Content>
            </Card>

            {/* Theo độ tuổi */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>🎂 Theo độ tuổi</Text>
                    {ageEntries.map(([label, value], i) => (
                        <BarRow key={i} label={label} value={value}
                                max={maxAge} color={COLORS_LIST[i % COLORS_LIST.length]} />
                    ))}
                </Card.Content>
            </Card>

            {/* Theo chuyên khoa */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>🏥 Theo chuyên khoa</Text>
                    {(data.by_specialty || []).length === 0
                        ? <Text style={styles.empty}>Không có dữ liệu</Text>
                        : (data.by_specialty || []).map((s, i) => (
                            <BarRow key={i}
                                    label={s.schedule__doctor__specialties__name || 'Khác'}
                                    value={s.count}
                                    max={maxSpecialty}
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
    container:    { flex: 1, backgroundColor: COLORS.background },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overviewCard: { margin: 12, borderRadius: 12, padding: 20, alignItems: 'center' },
    overviewIcon: { fontSize: 36, marginBottom: 4 },
    overviewVal:  { fontSize: 36, fontWeight: 'bold' },
    overviewLabel:{ color: COLORS.gray, fontSize: 13, marginTop: 2 },
    card:         { marginHorizontal: 12, marginTop: 10, borderRadius: 12 },
    cardTitle:    { fontWeight: 'bold', fontSize: 14, color: COLORS.text, marginBottom: 12 },
    genderRow:    { flexDirection: 'row', gap: 10 },
    genderCard:   { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10,
                    padding: 14, alignItems: 'center', borderTopWidth: 3 },
    genderVal:    { fontSize: 24, fontWeight: 'bold' },
    genderLabel:  { color: COLORS.gray, fontSize: 12, marginTop: 2 },
    genderPct:    { fontSize: 13, fontWeight: '600', marginTop: 4 },
    barRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    barLabel:     { width: 52, fontSize: 12, color: COLORS.text },
    barTrack:     { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 4, height: 10 },
    barFill:      { height: 10, borderRadius: 4, minWidth: 4 },
    barValue:     { width: 28, fontSize: 12, fontWeight: 'bold',
                    color: COLORS.text, textAlign: 'right' },
    empty:        { color: COLORS.gray, textAlign: 'center', marginVertical: 12 },
});