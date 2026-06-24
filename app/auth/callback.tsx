import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/services/supabase";
import { useUserStore } from "../../src/stores/useUserStore";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setAuth } = useUserStore();

  useEffect(() => {
    (async () => {
      const { access_token, refresh_token } = params;

      if (access_token && refresh_token) {
        const { data } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (data.session?.user) {
          setAuth(data.session.user.id, data.session.user.email ?? "");
        }
      }

      router.replace("/");
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0F1115",
      }}
    >
      <ActivityIndicator size="large" color="#D1F566" />
    </View>
  );
}
