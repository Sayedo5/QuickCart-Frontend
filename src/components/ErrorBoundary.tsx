import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { palette, spacing } from '@/theme';
import { captureException } from '@/services/monitoring';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global error boundary. Catches render-time crashes anywhere in the tree,
 * reports them to Sentry (when configured) and shows a recoverable screen
 * instead of a white screen or a native crash dialog.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={40} color={palette.primary} />
        </View>
        <AppText variant="h2" align="center" color="#1A1A1A">
          Something went wrong
        </AppText>
        <AppText variant="body" align="center" color="#6B6B6B" style={styles.subtitle}>
          The app hit an unexpected error. Your cart and orders are safe. Tap below to continue.
        </AppText>
        {__DEV__ ? (
          <AppText variant="caption" color="#9A9A9A" align="center" style={styles.debug} numberOfLines={6}>
            {this.state.error.message}
          </AppText>
        ) : null}
        <Button title="Try again" onPress={this.reset} fullWidth={false} style={styles.button} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF1EB', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  debug: { marginTop: spacing.md, fontFamily: 'Inter_400Regular' },
  button: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});
