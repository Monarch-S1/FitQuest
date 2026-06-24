/**
 * Manual mock for react-native-reanimated
 * Provides minimal mock implementations so components using
 * useSharedValue, useAnimatedStyle, withSpring, etc. can be tested.
 */
const React = require("react");
const { View } = require("react-native");

function createReanimatedComponent(name) {
  const Comp = React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
  Comp.displayName = "Reanimated." + name;
  return Comp;
}

const Reanimated = {
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: (factory) => factory(),
  useDerivedValue: (factory) => ({ value: factory() }),
  withSpring: (value) => value,
  withTiming: (value) => value,
  withSequence: (...values) => values[values.length - 1],
  withDelay: (_delay, value) => value,
  withRepeat: (animation) => animation,
  cancelAnimation: () => {},
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    in: (t) => t,
    out: (t) => t,
    inOut: (t) => t,
    sin: (t) => t,
    exp: (t) => t,
    bezier: () => (t) => t,
  },
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  createAnimatedComponent: (Component) => Component,
  // Animated components
  View: createReanimatedComponent("View"),
  Text: createReanimatedComponent("Text"),
  ScrollView: createReanimatedComponent("ScrollView"),
  Image: createReanimatedComponent("Image"),
  // Reanimated module default
  default: {
    createAnimatedComponent: (Component) => Component,
    View: createReanimatedComponent("default.View"),
  },
};

module.exports = Reanimated;
