/**
 * Manual mock for moti — strips all animation props and renders as plain View.
 * Avoids importing native modules (react-native-reanimated, worklets) in Jest.
 */
const React = require("react");
const { View } = require("react-native");

const MockMotiView = React.forwardRef(({ children, ...props }, ref) => {
  const { from, animate, transition, ...viewProps } = props;
  return React.createElement(View, { ...viewProps, ref }, children);
});
MockMotiView.displayName = "MotiView";

module.exports = {
  MotiView: MockMotiView,
  View: MockMotiView,
};
