import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const UNIT_CHOICES = [
    { label: 'Viên',  value: 'vien' },
    { label: 'Chai',  value: 'chai' },
    { label: 'Hộp',   value: 'hop'  },
    { label: 'Ống',   value: 'ong'  },
    { label: 'Gói',   value: 'goi'  },
    { label: 'ml',    value: 'ml'   },
    { label: 'mg',    value: 'mg'   },
];

export default function MedicineFormScreen({ navigation, route }) {
    const medicine = route?.params?.medicine; // null = thêm mới, object = sửa

    const [categories, setCategories] = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [form,       setForm]       = useState({
        name:         medicine?.name         || '',
        ingredient:   medicine?.ingredient   || '',
        category:     medicine?.category     || '',
        unit:         medicine?.unit         || 'vien',
        price:        medicine?.price        || '',
        description:  medicine?.description  || '',
        // Inventory
        quantity:     '',
        min_quantity: '10',
        expiry_date:  '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['categories']);
                setCategories(res.data.results || res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, []);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {

        if (!form.name || !form.category || !form.price) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên, danh mục và giá!');
            return;
        }

        try {
            setLoading(true);
            const api = await authApis();

            if (medicine) {
                // ── SỬA THUỐC ──
                await api.put(endpoints['medicine-detail'](medicine.id), {
                    name:        form.name,
                    ingredient:  form.ingredient,
                    category:    Number(form.category),
                    unit:        form.unit,
                    price:       parseFloat(form.price),
                    description: form.description,
                });
                Alert.alert('Thành công', 'Đã cập nhật thuốc!');
                navigation.goBack();
                return;
            }

            // ── THÊM THUỐC MỚI ──

            // Bước 1: Tạo thuốc
            const res = await api.post(endpoints['medicines'], {
                name:        form.name,
                ingredient:  form.ingredient,
                category:    Number(form.category),   // ép kiểu number
                unit:        form.unit,
                price:       parseFloat(form.price),  // ép kiểu number
                description: form.description,
            });
          
            const newMedicine = res.data;
            const medicineId = newMedicine.id || newMedicine.medicine_id || newMedicine.pk;

            if (!medicineId) {
                Alert.alert('Lỗi', 'Không lấy được ID thuốc vừa tạo!\nResponse: ' + JSON.stringify(newMedicine));
                return;
            }

            // Bước 2: Tạo inventory
            await api.post(endpoints['inventory'], {
                medicine:     medicineId,  // ✅ dùng medicineId thay vì newMedicine.id
                quantity:     0,
                min_quantity: parseInt(form.min_quantity) || 10,
                expiry_date:  form.expiry_date || '2027-12-31',
            });

            // Bước 3: Nhập kho
            if (form.quantity && parseInt(form.quantity) > 0) {
                await api.post(endpoints['stock-transactions'], {
                    medicine:         medicineId,  // ✅ dùng medicineId
                    transaction_type: 'import',
                    quantity:         parseInt(form.quantity),
                    note:             'Nhập kho ban đầu',
                });
            }
            Alert.alert('Thành công', 'Đã thêm thuốc và nhập kho!');
            navigation.goBack();

        } catch (err) {
            console.error('❌ handleSubmit lỗi:', err.config?.url, err.response?.data);
            Alert.alert('Lỗi', JSON.stringify(err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Thông tin thuốc</Text>

                <TextInput label="Tên thuốc *" value={form.name}
                           onChangeText={(v) => update('name', v)}
                           style={styles.input} mode="outlined" />

                <TextInput label="Hoạt chất" value={form.ingredient}
                           onChangeText={(v) => update('ingredient', v)}
                           style={styles.input} mode="outlined" />

                <Text style={styles.label}>Danh mục *</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={form.category}
                            onValueChange={(v) => update('category', v)}>
                        <Picker.Item label="-- Chọn danh mục --" value="" />
                        {categories.map(c => (
                            <Picker.Item key={c.id} label={c.name} value={c.id} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Đơn vị *</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={form.unit}
                            onValueChange={(v) => update('unit', v)}>
                        {UNIT_CHOICES.map(u => (
                            <Picker.Item key={u.value} label={u.label} value={u.value} />
                        ))}
                    </Picker>
                </View>

                <TextInput label="Giá bán (VNĐ) *" value={form.price}
                           onChangeText={(v) => update('price', v)}
                           style={styles.input} mode="outlined"
                           keyboardType="numeric" />

                <TextInput label="Mô tả" value={form.description}
                           onChangeText={(v) => update('description', v)}
                           style={styles.input} mode="outlined"
                           multiline numberOfLines={3} />

                {!medicine && (
                    <>
                        <Text style={styles.sectionTitle}>Thông tin kho</Text>

                        <TextInput label="Số lượng nhập" value={form.quantity}
                                   onChangeText={(v) => update('quantity', v)}
                                   style={styles.input} mode="outlined"
                                   keyboardType="numeric" />

                        <TextInput label="Tồn kho tối thiểu" value={form.min_quantity}
                                   onChangeText={(v) => update('min_quantity', v)}
                                   style={styles.input} mode="outlined"
                                   keyboardType="numeric" />

                        <TextInput label="Hạn sử dụng (YYYY-MM-DD)" value={form.expiry_date}
                                   onChangeText={(v) => update('expiry_date', v)}
                                   style={styles.input} mode="outlined"
                                   placeholder="2027-12-31" />
                    </>
                )}

                <Button mode="contained" onPress={handleSubmit}
                        loading={loading} disabled={loading}
                        style={styles.btn} buttonColor={COLORS.primary}>
                    {medicine ? 'Cập nhật thuốc' : 'Thêm thuốc'}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: COLORS.background },
    form:         { padding: 16 },
    sectionTitle: { fontWeight: 'bold', fontSize: 16, color: COLORS.text,
                    marginTop: 16, marginBottom: 8 },
    input:        { marginBottom: 12, backgroundColor: '#fff' },
    label:        { color: COLORS.gray, fontSize: 13, marginBottom: 4 },
    pickerBox:    { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
                    marginBottom: 12, backgroundColor: '#fff' },
    btn:          { marginTop: 16, borderRadius: 8, paddingVertical: 4 },
});