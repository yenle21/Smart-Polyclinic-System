import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, Chip, FAB } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function MedicineListScreen({ navigation, route }) {
    const categoryId   = route?.params?.categoryId;
    const categoryName = route?.params?.categoryName;

    const [medicines,  setMedicines]  = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');

    const fetchMedicines = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['medicines'], {
                params: { q: search, category_id: categoryId },
            });
            setMedicines(res.data.results || res.data);
        } catch (err) {
            console.error('fetchMedicines:', err);
        } finally {
            setRefreshing(false);
        }
    }, [search, categoryId]);

    useEffect(() => {
        if (categoryName) navigation.setOptions({ title: categoryName });
        fetchMedicines();
    }, [fetchMedicines]);

    const renderItem = ({ item }) => (
        <Card style={styles.card}
              onPress={() => navigation.navigate('MedicineDetail', { id: item.id })}>
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
                    {item.stock_quantity <= 10 && (
                        <Chip icon="alert" textStyle={{ fontSize: 10 }} style={styles.lowChip}>
                            Thấp
                        </Chip>
                    )}
                </View>
                <Text style={styles.category}>{item.category_name || 'Chưa phân loại'}</Text>
                <View style={styles.row}>
                    <Text style={styles.price}>{formatMoney(item.price)} / {item.unit}</Text>
                    <Text style={styles.stock}>Tồn: {item.stock_quantity ?? '---'}</Text>
                </View>
            </Card.Content>
        </Card>
        
    );

    return (
        <View style={styles.container}>
            <Searchbar placeholder="Tìm thuốc..." value={search}
                       onChangeText={setSearch} onSubmitEditing={fetchMedicines}
                       style={styles.searchbar} />
            <FlatList
                data={medicines}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); fetchMedicines(); }} />}
                ListEmptyComponent={<Text style={styles.empty}>Không có thuốc nào</Text>}
            />
        </View>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    searchbar: { margin: 12, borderRadius: 10 },
    list:      { paddingHorizontal: 12, paddingBottom: 20 },
    card:      { marginBottom: 10, borderRadius: 12 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:      { fontWeight: 'bold', flex: 1 },
    category:  { color: COLORS.gray, marginVertical: 4 },
    price:     { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    stock:     { color: COLORS.gray, fontSize: 12 },
    lowChip:   { backgroundColor: '#FEE2E2' },
    empty:     { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});