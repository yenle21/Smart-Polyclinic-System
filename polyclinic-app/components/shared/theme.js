import { MD3LightTheme } from 'react-native-paper';
import colors from '../../styles/colors';

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary:   colors.primary,
        secondary: colors.secondary,
        error:     colors.danger,
        background: colors.background,
    },
};