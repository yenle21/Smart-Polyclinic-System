import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

export default function Card({ children, onPress, style }) {
    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {children}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius:    12,
        padding:         14,
        marginBottom:    10,
        elevation:       2,
        shadowColor:     '#000',
        shadowOpacity:   0.06,
        shadowOffset:    { width: 0, height: 2 },
        shadowRadius:    4,
    },
});