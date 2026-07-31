import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { supabase } from '../services/supabaseClient';
import { spacing } from '../theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('इमेल र पासवर्ड दुवै आवश्यक छ।');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('खाता खोल्न पूरा नाम आवश्यक छ।');
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName.trim(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }
    }
    setLoading(false);

    if (isSignUp) {
      setMessage('खाता खुल्यो। इमेल पुष्टि सक्षम भए तपाईंको इमेल जाँच गर्नुहोस्।');
    }
  };

  return (
    <Surface style={styles.container} elevation={0}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Card mode="elevated" elevation={2} style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
              Swar-Lekhak
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.md }}>
              {isSignUp ? 'नयाँ खाता खोल्नुहोस्' : 'जारी राख्न साइन इन गर्नुहोस्'}
            </Text>

            <SegmentedButtons
              value={mode}
              onValueChange={(value) => {
                setMode(value as 'sign-in' | 'sign-up');
                setError(null);
                setMessage(null);
              }}
              buttons={[
                { value: 'sign-in', label: 'साइन इन', icon: 'login' },
                { value: 'sign-up', label: 'खाता खोल्नुहोस्', icon: 'account-plus' },
              ]}
              style={styles.segmented}
            />

            <View style={styles.form}>
              {isSignUp && (
                <TextInput
                  label="पूरा नाम"
                  mode="outlined"
                  onChangeText={setFullName}
                  value={fullName}
                />
              )}
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="इमेल"
                mode="outlined"
                onChangeText={setEmail}
                value={email}
                left={<TextInput.Icon icon="email-outline" />}
              />
              <TextInput
                autoCapitalize="none"
                label="पासवर्ड"
                mode="outlined"
                onChangeText={setPassword}
                secureTextEntry
                value={password}
                left={<TextInput.Icon icon="lock-outline" />}
              />

              {error ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>{error}</Text>
              ) : null}
              {message ? (
                <Text variant="bodySmall" style={{ color: theme.colors.tertiary }}>{message}</Text>
              ) : null}

              <Button
                disabled={loading}
                loading={loading}
                mode="contained"
                onPress={handleSubmit}
                style={styles.submit}
                contentStyle={styles.submitContent}
              >
                {isSignUp ? 'खाता खोल्नुहोस्' : 'साइन इन'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.containerMargin,
  },
  card: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  cardContent: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  segmented: {
    marginBottom: spacing.sm,
  },
  form: {
    gap: 12,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: 4,
  },
  submitContent: {
    paddingVertical: 4,
  },
});
