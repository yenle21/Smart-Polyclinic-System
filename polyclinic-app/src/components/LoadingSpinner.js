import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { COLORS } from '../constants/colors';

export default function LoadingSpinner() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});