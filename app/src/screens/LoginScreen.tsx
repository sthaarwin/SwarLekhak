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
      setError('Email and password are required.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Full name is required for sign-up.');
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
      setMessage('Account created. Check your email if confirmation is enabled.');
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
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
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
              Sign In
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
              Sign Up
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              label="Full Name"
              mode="outlined"
              onChangeText={setFullName}
              value={fullName}
            />
          )}
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            mode="outlined"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            label="Password"
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
            {isSignUp ? 'Create Account' : 'Sign In'}
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
