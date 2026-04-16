import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const MESSAGES = [
  "Architecting your personalized flow...",
  "Calibrating macronutrient targets...",
  "Designing optimal workout sequences...",
  "Integrating recovery strategies...",
  "Finalizing your daily mastery plan..."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message 
}) => {
  const { colors, isDark } = useTheme();
  const [currentMessage, setCurrentMessage] = useState(message || MESSAGES[0]);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!visible || message) return;

    let index = 0;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        index = (index + 1) % MESSAGES.length;
        setCurrentMessage(MESSAGES[index]);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [visible, message]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <BlurView intensity={isDark ? 40 : 60} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
            </View>
            
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
            
            <Animated.Text style={[styles.message, { color: colors.textPrimary, opacity: fadeAnim }]}>
              {message || currentMessage}
            </Animated.Text>
            
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              This usually takes 10-15 seconds.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 50, // Prevent jumping
  },
  subtext: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
});
