import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, Badge } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const TYPE_ICON = {
    reminder:     '🗓️',
    confirmed:    '✅',
    cancelled:    '❌',
    result:       '🧪',
    follow_up:    '📅',
    prescription: '💊',
    invoice:      '🧾',
    general:      '📢',
};

const NotificationScreen = ({ onUnreadChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(false);
    const [refreshing, setRefreshing]       = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(endpoints['notifications']);
            const data = res.data.results ?? res.data;
            setNotifications(data);
            // ✅ Cập nhật badge sau khi load
            onUnreadChange?.(data.filter(n => !n.is_read).length);
        } catch (ex) {
            console.log('LOAD NOTIFICATIONS ERROR:', ex.response?.data);
        } finally {
            setLoading(false);
        }
    }, [onUnreadChange]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    const markRead = async (id) => {
        try {
            const api = await authApis();
            await api.patch(endpoints['notification-read'](id));
            setNotifications(prev => {
                const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
                // ✅ Cập nhật badge
                onUnreadChange?.(updated.filter(n => !n.is_read).length);
                return updated;
            });
        } catch (ex) {
            console.log('MARK READ ERROR:', ex.response?.data);
        }
    };

    const markAllRead = async () => {
        try {
            const api = await authApis();
            await api.patch(endpoints['notifications-read-all']);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            // ✅ Reset badge về 0
            onUnreadChange?.(0);
        } catch (ex) {
            console.log('MARK ALL READ ERROR:', ex.response?.data);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    if (loading && notifications.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#2196F3']}
                    tintColor="#2196F3"
                />
            }
            ListHeaderComponent={
                notifications.some(n => !n.is_read) ? (
                    <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
                        <Text style={styles.markAllText}>✓ Đánh dấu tất cả đã đọc</Text>
                    </TouchableOpacity>
                ) : null
            }
            ListEmptyComponent={
                <Text style={styles.empty}>Không có thông báo nào.</Text>
            }
            renderItem={({ item }) => (
                <Card
                    style={[styles.card, !item.is_read && styles.unread]}
                    onPress={() => !item.is_read && markRead(item.id)}
                >
                    <Card.Content style={styles.cardContent}>
                        <Text style={styles.icon}>
                            {TYPE_ICON[item.type] ?? '📢'}
                        </Text>
                        <View style={styles.textBlock}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>{item.title}</Text>
                                {!item.is_read && (
                                    <Badge size={10} style={styles.dot} />
                                )}
                            </View>
                            <Text style={styles.message}>{item.message}</Text>
                            <Text style={styles.date}>
                                {new Date(item.created_date).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>
            )}
        />
    );
};

export default NotificationScreen;

const styles = StyleSheet.create({
    list:             { padding: 16, backgroundColor: '#f5f5f5', flexGrow: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty:            { textAlign: 'center', marginTop: 40, color: '#999' },
    markAllBtn:       { alignSelf: 'flex-end', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#e8f0fe', borderRadius: 20 },
    markAllText:      { color: '#2196F3', fontWeight: '600', fontSize: 13 },
    card:             { marginBottom: 12, borderRadius: 12 },
    unread:           { backgroundColor: '#eef4ff', borderLeftWidth: 4, borderLeftColor: '#4A90D9' },
    cardContent:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    icon:             { fontSize: 28, marginTop: 2 },
    textBlock:        { flex: 1 },
    titleRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title:            { fontWeight: '700', fontSize: 15, color: '#222', flex: 1 },
    dot:              { backgroundColor: '#4A90D9', marginLeft: 8 },
    message:          { color: '#555', marginTop: 4, lineHeight: 20 },
    date:             { color: '#aaa', fontSize: 12, marginTop: 6 },
});