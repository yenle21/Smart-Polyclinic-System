import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../styles/colors';

export default function AppHeader({ title, onBack, rightIcon, onRightPress }) {
    return (
        <View style={styles.header}>
            {onBack ? (
                <TouchableOpacity onPress={onBack}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
                </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}

            <Text style={styles.title}>{title}</Text>

            {rightIcon ? (
                <TouchableOpacity onPress={onRightPress}>
                    <MaterialCommunityIcons name={rightIcon} size={24} color={colors.white} />
                </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor:  colors.primary,
        flexDirection:    'row',
        alignItems:       'center',
        justifyContent:   'space-between',
        paddingHorizontal: 16,
        paddingVertical:   14,
        paddingTop:        50,
    },
    title: { color: colors.white, fontSize: 17, fontWeight: '600' },
});