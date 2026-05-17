import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function EmptyState({ icon = 'inbox', message = 'Không có dữ liệu' }) {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name={icon} size={64} color={COLORS.gray} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    text:      { color: COLORS.gray, fontSize: 14, marginTop: 12, textAlign: 'center' },
});