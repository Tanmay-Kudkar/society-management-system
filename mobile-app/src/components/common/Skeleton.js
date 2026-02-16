/**
 * Skeleton.js
 * YouTube / social-media style shimmer skeleton loading components
 * for React Native (Expo). Works with light & dark themes.
 *
 * Uses React Native Animated API for smooth shimmer effect.
 * Responsive for phones & tablets via Layout constants.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Layout } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

/* ─── Shimmer Bone (base primitive) ─── */
export const Bone = ({
  width = '100%',
  height = 16,
  borderRadius = Layout.borderRadius.sm,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const bgColor = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      theme.border || '#2a2a2a',
      theme.surface || '#3a3a3a',
      theme.border || '#2a2a2a',
    ],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    />
  );
};

/* ─── SkeletonCard wrapper ─── */
export const SkeletonCard = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: Layout.borderRadius.lg,
          padding: Layout.spacing.md,
          borderWidth: 1,
          borderColor: theme.border,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/* ─── Row helper ─── */
const Row = ({ children, gap = 12, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
    {children}
  </View>
);

/* ─── Col helper ─── */
const Col = ({ children, gap = 8, style }) => (
  <View style={[{ flex: 1, gap }, style]}>{children}</View>
);

/* ─── Wake-Up Banner ─── */
export const WakeUpBanner = ({ show = true }) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!show) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [show, pulseAnim]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          padding: Layout.spacing.md,
          borderRadius: Layout.borderRadius.lg,
          marginBottom: Layout.spacing.md,
          borderWidth: 1,
          borderColor: theme.border,
          gap: 12,
          opacity: pulseAnim,
        },
      ]}
    >
      <Animated.Text style={{ fontSize: 20 }}>☕</Animated.Text>
      <View style={{ flex: 1 }}>
        <Animated.Text
          style={{
            color: theme.text,
            fontSize: Layout.fontSize.md,
            fontWeight: '600',
            marginBottom: 2,
          }}
        >
          Waking up the server…
        </Animated.Text>
        <Animated.Text
          style={{ color: theme.textSecondary, fontSize: Layout.fontSize.sm }}
        >
          Free-tier servers sleep after inactivity. This takes 15–30s.
        </Animated.Text>
      </View>
      <Row gap={4}>
        {[0, 1, 2].map((i) => (
          <PulseDot key={i} delay={i * 200} theme={theme} />
        ))}
      </Row>
    </Animated.View>
  );
};

const PulseDot = ({ delay, theme }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.primary,
        opacity: anim,
      }}
    />
  );
};

/* ─── Stat Card Skeleton ─── */
export const StatCardSkeleton = ({ count = 4 }) => {
  const cols = isTablet ? 4 : 2;
  const rows = Math.ceil(count / cols);
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <Row key={r} gap={12}>
          {Array.from({ length: cols })
            .slice(0, count - r * cols)
            .map((_, c) => (
              <View key={c} style={{ flex: 1 }}>
                <SkeletonCard>
                  <Bone width={40} height={40} borderRadius={Layout.borderRadius.md} />
                  <Bone width="55%" height={22} />
                  <Bone width="75%" height={12} />
                </SkeletonCard>
              </View>
            ))}
        </Row>
      ))}
    </View>
  );
};

/* ─── Summary Card (big amount + button) ─── */
export const SummaryCardSkeleton = () => (
  <SkeletonCard style={{ alignItems: 'center', paddingVertical: 24 }}>
    <Bone width="40%" height={14} />
    <Bone width="50%" height={32} />
    <Bone width={140} height={44} borderRadius={Layout.borderRadius.lg} style={{ marginTop: 8 }} />
  </SkeletonCard>
);

/* ─── Filter Pills Row ─── */
const PILL_WIDTHS = [80, 72, 95, 68, 88, 76];

export const FilterPillsSkeleton = ({ count = 4 }) => (
  <Row gap={8} style={{ marginBottom: Layout.spacing.md }}>
    {Array.from({ length: count }).map((_, i) => (
      <Bone key={i} width={PILL_WIDTHS[i % PILL_WIDTHS.length]} height={34} borderRadius={20} />
    ))}
  </Row>
);

/* ─── Card List Skeleton (FlatList replacement) ─── */
export const CardListSkeleton = ({ count = 5, showAvatar = true, cardHeight = 100 }) => (
  <View style={{ gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={{ minHeight: cardHeight }}>
        <Row gap={12}>
          {showAvatar && <Bone width={44} height={44} borderRadius={22} />}
          <Col>
            <Bone width="60%" height={16} />
            <Bone width="85%" height={12} />
          </Col>
          <Bone width={60} height={24} borderRadius={12} />
        </Row>
        <Bone width="90%" height={11} />
        <Row gap={8}>
          <Bone width={60} height={11} />
          <Bone width={80} height={11} />
        </Row>
      </SkeletonCard>
    ))}
  </View>
);

/* ─── Quick Action Grid Skeleton ─── */
export const QuickActionsSkeleton = ({ count = 4 }) => {
  const cols = isTablet ? 4 : count <= 4 ? count : 2;
  const rows = Math.ceil(count / cols);
  return (
    <View style={{ gap: 12, marginVertical: Layout.spacing.md }}>
      {Array.from({ length: rows }).map((_, r) => (
        <Row key={r} gap={12}>
          {Array.from({ length: Math.min(cols, count - r * cols) }).map((_, c) => (
            <View key={c} style={{ flex: 1, alignItems: 'center' }}>
              <SkeletonCard style={{ alignItems: 'center', width: '100%', paddingVertical: 16 }}>
                <Bone width={48} height={48} borderRadius={24} />
                <Bone width="60%" height={12} style={{ marginTop: 8 }} />
              </SkeletonCard>
            </View>
          ))}
        </Row>
      ))}
    </View>
  );
};

/* ─── Header / Profile Skeleton ─── */
export const HeaderSkeleton = ({ showSubtitle = true }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.lg,
        backgroundColor: theme.card,
        borderRadius: Layout.borderRadius.lg,
        marginBottom: Layout.spacing.md,
        gap: 12,
      }}
    >
      <Row gap={14}>
        <Bone width={52} height={52} borderRadius={26} />
        <Col>
          <Bone width="50%" height={20} />
          {showSubtitle && <Bone width="35%" height={14} />}
        </Col>
      </Row>
    </View>
  );
};

/* ─── Dashboard Skeleton Compositions ─── */

export const AdminDashboardSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <HeaderSkeleton />
    <QuickActionsSkeleton count={4} />
    <StatCardSkeleton count={6} />
    <SkeletonCard style={{ height: 120 }}>
      <Bone width="40%" height={16} />
      <Bone width="90%" height={12} />
      <Bone width="70%" height={12} />
    </SkeletonCard>
  </View>
);

export const MemberDashboardSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <HeaderSkeleton />
    <SummaryCardSkeleton />
    <QuickActionsSkeleton count={4} />
    <Row gap={12}>
      <View style={{ flex: 1 }}>
        <SkeletonCard>
          <Bone width={36} height={36} borderRadius={18} />
          <Bone width="50%" height={20} />
          <Bone width="70%" height={12} />
        </SkeletonCard>
      </View>
      <View style={{ flex: 1 }}>
        <SkeletonCard>
          <Bone width={36} height={36} borderRadius={18} />
          <Bone width="50%" height={20} />
          <Bone width="70%" height={12} />
        </SkeletonCard>
      </View>
    </Row>
    <CardListSkeleton count={2} showAvatar={false} cardHeight={80} />
  </View>
);

export const StaffDashboardSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <HeaderSkeleton />
    <Row gap={12}>
      <View style={{ flex: 1 }}>
        <SkeletonCard>
          <Bone width="50%" height={22} />
          <Bone width="70%" height={14} />
        </SkeletonCard>
      </View>
      <View style={{ flex: 1 }}>
        <SkeletonCard>
          <Bone width="50%" height={22} />
          <Bone width="70%" height={14} />
        </SkeletonCard>
      </View>
    </Row>
    <QuickActionsSkeleton count={4} />
    <CardListSkeleton count={3} showAvatar={true} cardHeight={90} />
  </View>
);

/* ─── Notice / Complaint / Visitor list skeleton ─── */
export const FilteredListSkeleton = ({ filterCount = 4, cardCount = 5, showAvatar = true }) => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <FilterPillsSkeleton count={filterCount} />
    <CardListSkeleton count={cardCount} showAvatar={showAvatar} />
  </View>
);

/* ─── Payment / Maintenance skeleton ─── */
export const PaymentPageSkeleton = ({ tabCount = 2, cardCount = 3 }) => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <SummaryCardSkeleton />
    <FilterPillsSkeleton count={tabCount} />
    <CardListSkeleton count={cardCount} showAvatar={false} />
  </View>
);

/* ─── Vehicle page skeleton ─── */
export const VehiclesSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <SummaryCardSkeleton />
    <CardListSkeleton count={4} showAvatar={true} cardHeight={90} />
  </View>
);

/* ─── Documents skeleton ─── */
export const DocumentsSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    <FilterPillsSkeleton count={5} />
    <CardListSkeleton count={5} showAvatar={false} cardHeight={80} />
  </View>
);

/* ─── Emergency Contacts skeleton ─── */
export const EmergencyContactsSkeleton = () => (
  <View style={{ padding: Layout.spacing.md, gap: Layout.spacing.md }}>
    <WakeUpBanner />
    {/* 2×2 emergency grid */}
    <Row gap={12}>
      {[0, 1].map((r) => (
        <View key={r} style={{ flex: 1 }}>
          <SkeletonCard style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Bone width={48} height={48} borderRadius={24} />
            <Bone width="60%" height={14} style={{ marginTop: 8 }} />
            <Bone width="40%" height={12} style={{ marginTop: 4 }} />
          </SkeletonCard>
        </View>
      ))}
    </Row>
    <Row gap={12}>
      {[0, 1].map((r) => (
        <View key={r} style={{ flex: 1 }}>
          <SkeletonCard style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Bone width={48} height={48} borderRadius={24} />
            <Bone width="60%" height={14} style={{ marginTop: 8 }} />
            <Bone width="40%" height={12} style={{ marginTop: 4 }} />
          </SkeletonCard>
        </View>
      ))}
    </Row>
    <CardListSkeleton count={3} showAvatar={true} cardHeight={70} />
  </View>
);

export default {
  Bone,
  WakeUpBanner,
  SkeletonCard,
  StatCardSkeleton,
  SummaryCardSkeleton,
  FilterPillsSkeleton,
  CardListSkeleton,
  QuickActionsSkeleton,
  HeaderSkeleton,
  AdminDashboardSkeleton,
  MemberDashboardSkeleton,
  StaffDashboardSkeleton,
  FilteredListSkeleton,
  PaymentPageSkeleton,
  VehiclesSkeleton,
  DocumentsSkeleton,
  EmergencyContactsSkeleton,
};
