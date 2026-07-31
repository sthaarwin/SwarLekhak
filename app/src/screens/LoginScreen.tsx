import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../services/supabaseClient';
import { borderRadius, colors, spacing } from '../theme';

export default function LoginScreen() {
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
          // We don't necessarily block the sign-up if profile creation fails,
          // as the auth user was already created.
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.panel}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Swar-Lekhak</Text>
          <Text style={styles.title}>
            {isSignUp ? 'नयाँ खाता खोल्नुहोस्' : 'जारी राख्न साइन इन गर्नुहोस्'}
          </Text>
        </View>

        <View style={styles.segmented}>
          <Pressable
            onPress={() => {
              setMode('sign-in');
              setError(null);
              setMessage(null);
            }}
            style={[styles.segment, !isSignUp && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>
              साइन इन
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('sign-up');
              setError(null);
              setMessage(null);
            }}
            style={[styles.segment, isSignUp && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>
              खाता खोल्नुहोस्
            </Text>
          </Pressable>
        </View>

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
          />
          <TextInput
            autoCapitalize="none"
            label="पासवर्ड"
            mode="outlined"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          <Button
            disabled={loading}
            loading={loading}
            mode="contained"
            onPress={handleSubmit}
            style={styles.submit}
          >
            {isSignUp ? 'खाता खोल्नुहोस्' : 'साइन इन'}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.containerMargin,
  },
  panel: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: spacing.stackGap,
  },
  brandBlock: {
    gap: 6,
  },
  brand: {
    color: colors.govBlueDark,
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainer,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: borderRadius.lg,
  },
  segmentActive: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  segmentText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  form: {
    gap: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  messageText: {
    color: colors.tertiary,
    fontSize: 13,
  },
  submit: {
    borderRadius: borderRadius.xl,
    marginTop: 4,
  },
});
