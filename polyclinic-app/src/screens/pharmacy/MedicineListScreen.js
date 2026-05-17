import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, FAB, Chip } from 'react-native-paper';
import pharmacyApi from '../../api/pharmacyApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { formatMoney } from '../../utils/formatters';

export default function MedicineListScreen({ navigation, route }) {
    const categoryId   = route?.params?.categoryId;
    const categoryName = route?.params?.categoryName;

    const [medicines,  setMedicines]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');

    const fetchMedicines = useCallback(async () => {
        try {
            const res = await pharmacyApi.getMedicines({
                q:           search,
                category_id: categoryId,
            });
            setMedicines(res.results || res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, categoryId]);

    useEffect(() => {
        if (categoryName) {
            navigation.setOptions({ title: categoryName });
        }
        fetchMedicines();
    }, [fetchMedicines]);

    const renderItem = ({ item }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('MedicineDetail', { id: item.id })}
        >
            <Card.Content>
                <View style={styles.row}>
                    <Text variant="titleMedium" style={styles.name}>
                        {item.name}
                    </Text>
                    {item.stock_quantity <= 10 && (
                        <Chip
                            icon="alert"
                            textStyle={{ fontSize: 10 }}
                            style={styles.lowChip}
                        >
                            Thấp
                        </Chip>
                    )}
                </View>
                <Text variant="bodySmall" style={styles.category}>
                    {item.category_name || 'Chưa phân loại'}
                </Text>
                <View style={styles.row}>
                    <Text style={styles.price}>
                        {formatMoney(item.price)} / {item.unit}
                    </Text>
                    <Text style={styles.stock}>
                        Tồn: {item.stock_quantity ?? '---'}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Tìm thuốc..."
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={fetchMedicines}
                style={styles.searchbar}
            />

            <FlatList
                data={medicines}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchMedicines(); }}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có thuốc nào</Text>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('MedicineForm', { medicine: null })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: COLORS.background },
    searchbar:  { margin: 12, borderRadius: 10 },
    list:       { paddingHorizontal: 12, paddingBottom: 80 },
    card:       { marginBottom: 10, borderRadius: 12 },
    row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:       { fontWeight: 'bold', flex: 1 },
    category:   { color: COLORS.gray, marginVertical: 4 },
    price:      { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    stock:      { color: COLORS.gray, fontSize: 12 },
    lowChip:    { backgroundColor: '#FEE2E2' },
    empty:      { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
    fab:        { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
});