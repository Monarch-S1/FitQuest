import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing } from "../src/tokens";

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Text
          style={{
            ...typography.label,
            color: colors.text.secondary,
            fontSize: 10,
          }}
        >
          PRIVACY POLICY
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            backgroundColor: colors.bg.elevated,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
            }}
          >
            BACK
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing[12],
        }}
      >
        <Text
          style={{
            ...typography.h2,
            color: colors.text.primary,
            fontSize: 20,
            marginBottom: spacing.xs,
          }}
        >
          Privacy Policy
        </Text>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.tertiary,
            fontSize: 10,
            marginBottom: spacing.lg,
          }}
        >
          Last updated: June 6, 2026
        </Text>

        {/* Section: Overview */}
        <Section title="OVERVIEW" colors={colors}>
          <BodyText colors={colors}>
            FitQuest (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a gamified fitness
            application built for Android devices. We respect your privacy and are committed to
            protecting your personal data.
          </BodyText>
        </Section>

        {/* Section: Data We Collect */}
        <Section title="DATA WE COLLECT" colors={colors}>
          <SubSection title="Account Information" colors={colors}>
            <Bullet colors={colors}>
              Email address — collected when you create an account via email
            </Bullet>
            <Bullet colors={colors}>Display name — provided by you during onboarding</Bullet>
          </SubSection>

          <SubSection title="Workout Data" colors={colors}>
            <Bullet colors={colors}>
              Workout sessions — exercises completed, sets, reps, duration, and XP earned
            </Bullet>
            <Bullet colors={colors}>
              Fitness profile — fitness goal and level selected during onboarding
            </Bullet>
            <Bullet colors={colors}>
              Streak and progress data — training frequency and progression metrics
            </Bullet>
          </SubSection>

          <SubSection title="Device Information" colors={colors}>
            <Bullet colors={colors}>
              Motion sensor data — accelerometer readings used solely for the auto rep counter
              during active workouts. Processed locally, never transmitted to our servers.
            </Bullet>
            <Bullet colors={colors}>
              Crash and diagnostic data — we use Sentry (sentry.io) for crash reporting. May collect
              device model, OS version, and error stack traces.
            </Bullet>
          </SubSection>
        </Section>

        {/* Section: How We Use Your Data */}
        <Section title="HOW WE USE YOUR DATA" colors={colors}>
          <Bullet colors={colors}>To provide and maintain the FitQuest training experience</Bullet>
          <Bullet colors={colors}>To track your workout progress and calculate XP/leveling</Bullet>
          <Bullet colors={colors}>To provide personalized workout recommendations</Bullet>
          <Bullet colors={colors}>
            To enable the auto rep counter feature using motion sensors
          </Bullet>
        </Section>

        {/* Section: Data Storage */}
        <Section title="DATA STORAGE" colors={colors}>
          <Bullet colors={colors}>
            All workout data is stored locally on your device using secure device storage
          </Bullet>
          <Bullet colors={colors}>
            Account data is managed through Supabase, a third-party authentication and database
            service
          </Bullet>
          <Bullet colors={colors}>
            We do not sell, trade, or share your personal information with third parties for
            marketing
          </Bullet>
        </Section>

        {/* Section: Third-Party Services */}
        <Section title="THIRD-PARTY SERVICES" colors={colors}>
          <Bullet colors={colors}>
            Supabase — Authentication and data storage (supabase.com/privacy)
          </Bullet>
          <Bullet colors={colors}>
            Sentry — Crash reporting and error monitoring (sentry.io/privacy/)
          </Bullet>
        </Section>

        {/* Section: Your Rights */}
        <Section title="YOUR RIGHTS" colors={colors}>
          <Bullet colors={colors}>
            Access: You can view all your data in the app&apos;s History and Profile screens
          </Bullet>
          <Bullet colors={colors}>
            Deletion: Uninstalling the app removes all local data. To delete account data, contact
            us at chamber.enterprise.1@gmail.com
          </Bullet>
          <Bullet colors={colors}>
            Portability: Your workout history is visible and can be manually exported
          </Bullet>
        </Section>

        {/* Section: Children's Privacy */}
        <Section title="CHILDREN'S PRIVACY" colors={colors}>
          <BodyText colors={colors}>
            FitQuest is not intended for use by children under the age of 13. We do not knowingly
            collect data from children under 13.
          </BodyText>
        </Section>

        {/* Section: Contact */}
        <Section title="CONTACT" colors={colors}>
          <BodyText colors={colors}>
            For questions about this privacy policy or your data, contact:
          </BodyText>
          <BodyText colors={colors} accent>
            chamber.enterprise.1@gmail.com
          </BodyText>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Internal helpers ── */

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          ...typography.label,
          color: colors.accent.DEFAULT,
          fontSize: 9,
          letterSpacing: 1,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function SubSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: spacing.sm, marginLeft: spacing.sm }}>
      <Text
        style={{
          ...typography.label,
          color: colors.text.secondary,
          fontSize: 8,
          marginBottom: spacing.xs,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Bullet({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.xs,
        marginLeft: spacing.sm,
      }}
    >
      <Text style={{ color: colors.accent.DEFAULT, fontSize: 10, marginTop: 1 }}>•</Text>
      <Text
        style={{
          ...typography.bodySmall,
          color: colors.text.secondary,
          fontSize: 11,
          lineHeight: 18,
          flex: 1,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

function BodyText({
  children,
  colors,
  accent,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <Text
      style={{
        ...typography.bodySmall,
        color: accent ? colors.accent.DEFAULT : colors.text.secondary,
        fontSize: 11,
        lineHeight: 18,
        marginLeft: spacing.sm,
      }}
    >
      {children}
    </Text>
  );
}
