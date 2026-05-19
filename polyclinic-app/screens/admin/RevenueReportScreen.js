import React, { useEffect, useState, useCallback } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    RefreshControl, Dimensions,
} from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const { width } = Dimensions.get('window');

const formatMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const PERIODS = [
    { label: 'Theo ngày',   value: 'day'   },
    { label: 'Theo tháng',  value: 'month' },
    { label: 'Theo năm',    value: 'year'  },
];

const METHOD_LABEL = {
    cash:     { label: 'Tiền mặt', icon: '💵' },
    transfer: { label: 'Chuyển khoản', icon: '🏦' },
    card:     { label: 'Thẻ',      icon: '💳' },
};

/* ── Bar chart ── */
function BarChart({ data, period }) {
    if (!data || data.length === 0)
        return <Text style={styles.empty}>Không có dữ liệu</Text>;

    const max = Math.max(...data.map(d => Number(d.total || 0)), 1);

    const getLabel = (d) => {
        if (period === 'day') {
            const key = d.paid_at__date;
            return key ? new Date(key).toLocaleDateString('vi-VN',
                { day: '2-digit', month: '2-digit' }) : '—';
        }
        if (period === 'month') return `T${d.paid_at__month}`;
        if (period === 'year')  return `${d.paid_at__year}`;
        return '—';
    };

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.barWrap, { width: Math.max(data.length * 56, width - 48) }]}>
                {data.map((d, i) => {
                    const pct = Number(d.total || 0) / max;
                    const h   = Math.max(pct * 120, 4);
                    const amt = Number(d.total || 0);
                    return (
                        <View key={i} style={styles.barCol}>
                            <Text style={styles.barAmt}>
                                {amt >= 1e6 ? `${(amt / 1e6).toFixed(1)}M`
                                            : `${(amt / 1e3).toFixed(0)}K`}
                            </Text>
                            <View style={[styles.bar, { height: h,
                                backgroundColor: COLORS.primary + 'CC' }]} />
                            <Text style={styles.barLabel}>{getLabel(d)}</Text>
                            <Text style={styles.barCount}>{d.count} HĐ</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

export default function RevenueReportScreen() {
    const [data,       setData]       = useState(null);
    const [period,     setPeriod]     = useState('month');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(
                `${endpoints['dashboard-revenue']}?period=${period}`
            );
            setData(res.data);
        } catch (err) {
            console.error('Revenue:', err.response?.data || err.message);
        } finally {
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <ScrollView style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchData(); }} />
                    }>

            {/* ── Tóm tắt ── */}
            <Card style={styles.summaryCard}>
                <Card.Content>
                    <Text style={styles.summaryTitle}>Tổng doanh thu</Text>
                    <Text style={styles.summaryAmount}>
                        {formatMoney(data?.summary?.total)}
                    </Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Số hóa đơn</Text>
                            <Text style={styles.summaryVal}>{data?.summary?.count || 0}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Trung bình/HĐ</Text>
                            <Text style={styles.summaryVal}>
                                {Number(data?.summary?.average || 0) >= 1e6
                                    ? `${(Number(data.summary.average) / 1e6).toFixed(1)}M`
                                    : formatMoney(data?.summary?.average)}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* ── Chọn kỳ ── */}
            <View style={styles.periodRow}>
                {PERIODS.map(p => (
                    <TouchableOpacity key={p.value}
                                      style={[styles.periodBtn,
                                          period === p.value && styles.periodBtnActive]}
                                      onPress={() => setPeriod(p.value)}>
                        <Text style={[styles.periodLabel,
                            period === p.value && styles.periodLabelActive]}>
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Biểu đồ ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>📊 Biểu đồ doanh thu</Text>
                    <BarChart data={data?.by_period} period={period} />
                </Card.Content>
            </Card>

            {/* ── Theo phương thức thanh toán ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>💳 Theo phương thức thanh toán</Text>
                    {data?.by_payment_method?.length > 0
                        ? data.by_payment_method.map((m, i) => {
                            const method = METHOD_LABEL[m.payment_method]
                                || { label: m.payment_method, icon: '💰' };
                            const total  = Number(data?.summary?.total || 1);
                            const pct    = ((Number(m.total) / total) * 100).toFixed(1);
                            return (
                                <View key={i} style={styles.methodRow}>
                                    <Text style={styles.methodIcon}>{method.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.methodHeader}>
                                            <Text style={styles.methodLabel}>{method.label}</Text>
                                            <Text style={styles.methodAmt}>
                                                {formatMoney(m.total)}
                                            </Text>
                                        </View>
                                        {/* Progress bar */}
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill,
                                                { width: `${pct}%`,
                                                  backgroundColor: COLORS.primary }]} />
                                        </View>
                                        <Text style={styles.methodPct}>
                                            {pct}% · {m.count} hóa đơn
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                        : <Text style={styles.empty}>Không có dữ liệu</Text>
                    }
                </Card.Content>
            </Card>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: COLORS.background },
    summaryCard:     { margin: 12, borderRadius: 12, backgroundColor: COLORS.primary },
    summaryTitle:    { color: '#fff', opacity: 0.85, fontSize: 13 },
    summaryAmount:   { color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
    summaryRow:      { flexDirection: 'row', marginTop: 8, gap: 24 },
    summaryItem:     {},
    summaryLabel:    { color: '#fff', opacity: 0.75, fontSize: 11 },
    summaryVal:      { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    periodRow:       { flexDirection: 'row', marginHorizontal: 12, marginBottom: 4,
                       backgroundColor: '#e5e7eb', borderRadius: 10, padding: 3 },
    periodBtn:       { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
    periodBtnActive: { backgroundColor: '#fff', elevation: 2 },
    periodLabel:     { fontSize: 13, color: COLORS.gray },
    periodLabelActive:{ fontWeight: 'bold', color: COLORS.primary },
    card:            { marginHorizontal: 12, marginTop: 10, borderRadius: 12 },
    cardTitle:       { fontWeight: 'bold', fontSize: 14, color: COLORS.text, marginBottom: 12 },
    barWrap:         { flexDirection: 'row', alignItems: 'flex-end',
                       paddingBottom: 4, height: 160 },
    barCol:          { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
    bar:             { width: '70%', borderRadius: 4, minHeight: 4 },
    barAmt:          { fontSize: 8, color: COLORS.gray, marginBottom: 2 },
    barLabel:        { fontSize: 9, color: COLORS.text, marginTop: 3, fontWeight: '600' },
    barCount:        { fontSize: 8, color: COLORS.gray },
    methodRow:       { flexDirection: 'row', alignItems: 'center',
                       paddingVertical: 8, gap: 10 },
    methodIcon:      { fontSize: 22 },
    methodHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    methodLabel:     { fontWeight: '600', color: COLORS.text, fontSize: 13 },
    methodAmt:       { fontWeight: 'bold', color: COLORS.primary, fontSize: 13 },
    progressBg:      { backgroundColor: '#e5e7eb', borderRadius: 4, height: 6 },
    progressFill:    { height: 6, borderRadius: 4 },
    methodPct:       { color: COLORS.gray, fontSize: 11, marginTop: 2 },
    empty:           { color: COLORS.gray, textAlign: 'center', marginVertical: 12 },
});