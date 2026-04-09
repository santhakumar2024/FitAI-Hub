// app/(tabs)/_layout.tsx
// Bottom nav — properly aligned using native tabBarLabel + tabBarIcon

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { RootState } from '../../store';

// ─── Platform constants ───────────────────────────────────────────────────────
const TAB_HEIGHT     = Platform.OS === 'ios' ? 88 : 65;
const BOTTOM_PAD     = Platform.OS === 'ios' ? 26 : 6;

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || 'NORMAL_USER';

  /**
   * Builds options for a conditionally-visible tab.
   * Completely removes the slot (no dead space) for non-allowed roles.
   */
  const tabOptions = (
    iconName: string,
    label: string,
    rolesAllowed: string[]
  ) => {
    const isVisible = rolesAllowed.includes(role);
    if (!isVisible) {
      return { tabBarButton: () => null };
    }
    return {
      tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
        <Ionicons
          name={(focused ? iconName : `${iconName}-outline`) as any}
          size={23}
          color={color}
        />
      ),
      tabBarLabel: label,
    };
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ── Tab bar container ────────────────────────────────────────────────
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: TAB_HEIGHT,
          paddingBottom: BOTTOM_PAD,
          paddingTop: Platform.OS === 'android' ? 4 : 8,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },

        // ── Let each tab item fill its slot evenly ───────────────────────────
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
          marginVertical: 0,
        },

        // ── Icon sizing & centering ──────────────────────────────────────────
        tabBarIconStyle: {
          marginBottom: -2,   // tighten gap between icon and label
        },

        // ── Label styles ─────────────────────────────────────────────────────
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
          paddingTop: 0,
        },

        // ── Tint colours ─────────────────────────────────────────────────────
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,

        // ── Active-tab pill background ────────────────────────────────────────
        tabBarActiveBackgroundColor: 'transparent',
      }}
    >
      {/* 1. HOME / DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={
                focused
                  ? role === 'NORMAL_USER' ? 'home' : 'grid'
                  : role === 'NORMAL_USER' ? 'home-outline' : 'grid-outline'
              }
              size={23}
              color={color}
            />
          ),
          tabBarLabel: role === 'NORMAL_USER' ? 'Home' : 'Dashboard',
        }}
      />

      {/* 2. PLAN — Normal User & Trainer */}
      <Tabs.Screen
        name="plan"
        options={
          ['NORMAL_USER', 'TRAINER'].includes(role)
            ? {
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons
                    name={
                      focused
                        ? (role === 'TRAINER' ? 'book' : 'flash')
                        : (role === 'TRAINER' ? 'book-outline' : 'flash-outline')
                    }
                    size={23}
                    color={color}
                  />
                ),
                tabBarLabel: role === 'TRAINER' ? 'Library' : 'AI Plan',
              }
            : { tabBarButton: () => null }
        }
      />

      {/* 3. CALENDAR — Normal User only */}
      <Tabs.Screen
        name="calendar"
        options={tabOptions('calendar', 'History', ['NORMAL_USER'])}
      />

      {/* 4. LOGS — Normal User only */}
      <Tabs.Screen
        name="logs"
        options={tabOptions('add-circle', 'Log', ['NORMAL_USER'])}
      />

      {/* 5. PROGRESS — Normal User only */}
      <Tabs.Screen
        name="progress"
        options={tabOptions('stats-chart', 'Stats', ['NORMAL_USER'])}
      />

      {/* 6. CLIENTS — Trainer only */}
      <Tabs.Screen
        name="clients"
        options={tabOptions('people', 'Clients', ['TRAINER'])}
      />

      {/* 7. GYM — Owner only */}
      <Tabs.Screen
        name="gym"
        options={tabOptions('business', 'My Gym', ['GYM_OWNER'])}
      />

      {/* 8. PROFILE — Always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={23}
              color={color}
            />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
