module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|moti|@sentry/.*)"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: ["**/__tests__/**/*.(test|spec).[jt]s?(x)", "**/*.(test|spec).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/expo-test/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!**/node_modules/**"
  ],
};
