import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const { width } = Dimensions.get('window');

/* ── Donut chart (CSS-free, dùng View xếp chồng) ── */
function CategoryChart({ data }) {
    if (!data || data.length === 0)
        return <Text style={styles.empty}>Không có dữ liệu</Text>;

    const total  = data.reduce((s, d) => s + d.count, 0);
    const COLORS_LIST = [
        '#6366F1','#10B981','#F59E0B','#EF4444',
        '#3B82F6','#EC4899','#14B8A6','#F97316',
    ];

    return (
        <View>
            {data.map((d, i) => {
                const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
                const color = COLORS_LIST[i % COLORS_LIST.length];
                return (
                    <View key={i} style={styles.catRow}>
                        <View style={[styles.catDot, { backgroundColor: color }]} />
                        <Text style={styles.catName} numberOfLines={1}>
                            {d.category__name || 'Không rõ'}
                        </Text>
                        <View style={styles.catBarWrap}>
                            <View style={[styles.catBar,
                                { width: `${pct}%`, backgroundColor: color + '99' }]} />
                        </View>
                        <Text style={styles.catPct}>{pct}%</Text>
                        <Text style={styles.catCount}>{d.count}</Text>
                    </View>
                );
            })}
        </View>
    );
}

/* ── Top prescribed ── */
function TopPrescribed({ data }) {
    if (!data || data.length === 0)
        return <Text style={styles.empty}>Không có dữ liệu</Text>;

    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <View>
            {data.map((d, i) => (
                <View key={i} style={styles.topRow}>
                    <Text style={styles.topRank}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.topName} numberOfLines={1}>
                            {d.items__medicine__name || '—'}
                        </Text>
                        <View style={styles.topBarWrap}>
                            <View style={[styles.topBar,
                                { width: `${(d.count / max) * 100}%` }]} />
                        </View>
                    </View>
                    <Text style={styles.topCount}>{d.count} lần</Text>
                </View>
            ))}
        </View>
    );
}

export default function MedicineReportScreen() {
    const [data,       setData]       = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['dashboard-medicines']);
            setData(res.data);
        } catch (err) {
            console.error('MedicineReport:', err.response?.data || err.message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (!data) return (
        <View style={styles.center}>
            <Text style={{ color: COLORS.gray }}>Đang tải...</Text>
        </View>
    );

    const alerts = [
        { label: 'Tồn kho thấp',  value: data.low_stock_count, color: '#F59E0B', icon: '⚠️' },
        { label: 'Sắp hết hạn',   value: data.expiring_count,  color: '#F97316', icon: '🗓️' },
        { label: 'Đã hết hạn',    value: data.expired_count,   color: '#EF4444', icon: '⛔' },
    ];

    return (
        <ScrollView style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }} />
                    }>

            {/* ── Tổng quan ── */}
            <View style={styles.overviewRow}>
                <View style={[styles.overviewCard, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={styles.overviewIcon}>💊</Text>
                    <Text style={[styles.overviewVal, { color: '#6366F1' }]}>
                        {data.total_medicines}
                    </Text>
                    <Text style={styles.overviewLabel}>Tổng thuốc</Text>
                </View>
                <View style={[styles.overviewCard, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.overviewIcon}>📂</Text>
                    <Text style={[styles.overviewVal, { color: '#10B981' }]}>
                        {data.total_categories}
                    </Text>
                    <Text style={styles.overviewLabel}>Danh mục</Text>
                </View>
            </View>

            {/* ── Cảnh báo kho ── */}
            <View style={styles.alertRow}>
                {alerts.map((a, i) => (
                    <View key={i} style={[styles.alertCard, { borderTopColor: a.color }]}>
                        <Text style={styles.alertIcon}>{a.icon}</Text>
                        <Text style={[styles.alertVal, { color: a.color }]}>{a.value}</Text>
                        <Text style={styles.alertLabel}>{a.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Theo danh mục ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>📂 Thuốc theo danh mục</Text>
                    <CategoryChart data={data.by_category} />
                </Card.Content>
            </Card>

            {/* ── Top kê đơn ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>🏆 Top 10 thuốc được kê nhiều nhất</Text>
                    <TopPrescribed data={data.top_prescribed} />
                </Card.Content>
            </Card>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: COLORS.background },
    center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overviewRow:   { flexDirection: 'row', margin: 12, gap: 10 },
    overviewCard:  { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
    overviewIcon:  { fontSize: 28, marginBottom: 4 },
    overviewVal:   { fontSize: 28, fontWeight: 'bold' },
    overviewLabel: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
    alertRow:      { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 4 },
    alertCard:     { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10,
                     borderTopWidth: 3, alignItems: 'center', elevation: 2 },
    alertIcon:     { fontSize: 18, marginBottom: 4 },
    alertVal:      { fontWeight: 'bold', fontSize: 18 },
    alertLabel:    { color: COLORS.gray, fontSize: 10, textAlign: 'center', marginTop: 2 },
    card:          { marginHorizontal: 12, marginTop: 10, borderRadius: 12 },
    cardTitle:     { fontWeight: 'bold', fontSize: 14, color: COLORS.text, marginBottom: 12 },
    catRow:        { flexDirection: 'row', alignItems: 'center',
                     marginBottom: 8, gap: 6 },
    catDot:        { width: 10, height: 10, borderRadius: 5 },
    catName:       { width: 90, fontSize: 12, color: COLORS.text },
    catBarWrap:    { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 4, height: 8 },
    catBar:        { height: 8, borderRadius: 4, minWidth: 4 },
    catPct:        { width: 38, fontSize: 11, color: COLORS.gray, textAlign: 'right' },
    catCount:      { width: 24, fontSize: 11, fontWeight: 'bold',
                     color: COLORS.text, textAlign: 'right' },
    topRow:        { flexDirection: 'row', alignItems: 'center',
                     paddingVertical: 6, gap: 8 },
    topRank:       { width: 24, fontWeight: 'bold', color: COLORS.gray, fontSize: 12 },
    topName:       { fontSize: 12, color: COLORS.text, marginBottom: 3 },
    topBarWrap:    { backgroundColor: '#f0f0f0', borderRadius: 4, height: 6 },
    topBar:        { height: 6, borderRadius: 4, backgroundColor: COLORS.primary + '99',
                     minWidth: 4 },
    topCount:      { width: 48, fontSize: 11, color: COLORS.primary,
                     fontWeight: 'bold', textAlign: 'right' },
    empty:         { color: COLORS.gray, textAlign: 'center', marginVertical: 12 },
});