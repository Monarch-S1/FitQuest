import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export type NetworkStatus = "online" | "offline" | "unknown";

/**
 * Monitor network connectivity status.
 * Returns current status and tracks changes over time.
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>("unknown");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Get initial state
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(connected);
      setStatus(connected ? "online" : state.isConnected === false ? "offline" : "unknown");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    status,
    isConnected,
    isOffline: status === "offline",
    isOnline: status === "online",
    isUnknown: status === "unknown",
  };
}
