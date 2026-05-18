import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

export default function AlertScreen() {
    const [alerts,     setAlerts]     = useState({ low_stock: { items: [] }, expiring_soon: { items: [] }, expired: { items: [] } });
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['alerts']);
            setAlerts(res.data);
        } catch (err) {
            console.error('fetchAlerts:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const Section = ({ title, color, items, renderItem }) => (
        items.length > 0 ? (
            <View style={styles.section}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color }]}>{title} ({items.length})</Text>
                {items.map((item, i) => renderItem(item, i))}
            </View>
        ) : null
    );

    return (
        <FlatList
            style={styles.container}
            data={[]}
            renderItem={null}
            refreshControl={<RefreshControl refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
            ListHeaderComponent={
                <View style={styles.content}>
                    <Section
                        title="⚠️ Tồn kho thấp"
                        color={COLORS.warning}
                        items={alerts.low_stock.items}
                        renderItem={(item, i) => (
                            <Card key={i} style={styles.card}>
                                <Card.Content>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.info}>Tồn: {item.quantity} / Tối thiểu: {item.min_quantity}</Text>
                                    <Text style={[styles.info, { color: COLORS.danger }]}>Thiếu: {item.shortage}</Text>
                                </Card.Content>
                            </Card>
                        )}
                    />
                    <Section
                        title="⏰ Sắp hết hạn"
                        color={COLORS.warning}
                        items={alerts.expiring_soon.items}
                        renderItem={(item, i) => (
                            <Card key={i} style={styles.card}>
                                <Card.Content>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.info}>Hạn: {item.expiry_date}</Text>
                                    <Text style={[styles.info, { color: COLORS.warning }]}>Còn {item.days_remaining} ngày</Text>
                                </Card.Content>
                            </Card>
                        )}
                    />
                    <Section
                        title="❌ Đã hết hạn"
                        color={COLORS.danger}
                        items={alerts.expired.items}
                        renderItem={(item, i) => (
                            <Card key={i} style={styles.card}>
                                <Card.Content>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.info}>Hạn: {item.expiry_date}</Text>
                                    <Text style={[styles.info, { color: COLORS.danger }]}>Đã hết hạn</Text>
                                </Card.Content>
                            </Card>
                        )}
                    />
                    {alerts.low_stock.items.length === 0 &&
                     alerts.expiring_soon.items.length === 0 &&
                     alerts.expired.items.length === 0 && (
                        <Text style={styles.empty}>✅ Không có cảnh báo nào</Text>
                    )}
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: COLORS.background },
    content:      { padding: 12 },
    section:      { marginBottom: 16 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
    card:         { marginBottom: 8, borderRadius: 12 },
    name:         { fontWeight: 'bold', color: COLORS.text },
    info:         { color: COLORS.gray, marginTop: 4, fontSize: 13 },
    empty:        { textAlign: 'center', color: COLORS.success, marginTop: 40, fontSize: 16 },
});