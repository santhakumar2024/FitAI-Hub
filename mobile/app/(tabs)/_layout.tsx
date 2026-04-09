// app/(tabs)/_layout.tsx
// Final Single-Pass Optimized Tab Navigator for FitAI Hub

import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { RootState } from '../../store';

/**
 * TabIcon Component
 * Purpose: Render a consistent, premium tab bar item with active highlighting.
 */
function TabIcon({ name, label, focused, colors }: { name: any; label: string; focused: boolean; colors: any }) {
  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingTop: Platform.OS === 'ios' ? 12 : 8,
      height: '100%',
      width: '100%'
    }}>
      <View style={{
        backgroundColor: focused ? `${colors.primary}15` : 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 2
      }}>
        <Ionicons
          name={focused ? name : `${name}-outline` as any}
          size={24}
          color={focused ? colors.primary : colors.textMuted}
        />
      </View>
      <Text style={{
        fontSize: 10,
        fontWeight: '700',
        color: focused ? colors.primary : colors.textMuted,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  // Default to NORMAL_USER if role is missing (ensure robustness)
  const role = user?.role || 'NORMAL_USER';

  /**
   * Helper to determine Tab Visibility and Space allocation.
   * By setting tabBarButton to null for hidden tabs, we ensure they occupy 0px in the footer.
   */
  const getTabOptions = (name: string, label: string, iconName: any, rolesAllowed: string[]) => {
    const isVisible = rolesAllowed.includes(role);
    
    return {
      tabBarButton: isVisible ? undefined : () => null, // CRITICAL: This removes the slot entirely
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <TabIcon 
          name={iconName} 
          label={label} 
          focused={focused} 
          colors={colors} 
        />
      )
    };
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 95 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {/* 1. HOME / DASHBOARD - Shared index */}
      <Tabs.Screen
        name="index"
        options={{ 
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name={role === 'NORMAL_USER' ? 'home' : 'grid'} 
              label={role === 'NORMAL_USER' ? 'Home' : 'Dashboard'} 
              focused={focused} 
              colors={colors} 
            />
          ) 
        }}
      />

      {/* 2. PLAN - Shared route name, different labels */}
      <Tabs.Screen
        name="plan"
        options={getTabOptions(
          'plan', 
          role === 'TRAINER' ? 'Library' : 'AI Plan', 
          role === 'TRAINER' ? 'book' : 'flash', 
          ['NORMAL_USER', 'TRAINER']
        )}
      />

      {/* 3. CALENDAR - Normal User only */}
      <Tabs.Screen
        name="calendar"
        options={getTabOptions('calendar', 'History', 'calendar', ['NORMAL_USER'])}
      />

      {/* 4. LOGS - Normal User only */}
      <Tabs.Screen
        name="logs"
        options={getTabOptions('logs', 'Log', 'add-circle', ['NORMAL_USER'])}
      />

      {/* 5. PROGRESS - Normal User only */}
      <Tabs.Screen
        name="progress"
        options={getTabOptions('progress', 'Stats', 'stats-chart', ['NORMAL_USER'])}
      />

      {/* 6. CLIENTS - Trainer only */}
      <Tabs.Screen
        name="clients"
        options={getTabOptions('clients', 'Clients', 'people', ['TRAINER'])}
      />

      {/* 7. GYM - Owner only */}
      <Tabs.Screen
        name="gym"
        options={getTabOptions('gym', 'My Gym', 'business', ['GYM_OWNER'])}
      />

      {/* 8. PROFILE - Always last */}
      <Tabs.Screen
        name="profile"
        options={{ 
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" label="Profile" focused={focused} colors={colors} />
          ) 
        }}
      />
    </Tabs>
  );
}
