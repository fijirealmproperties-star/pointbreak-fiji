import Constants from "expo-constants";

const extra =
  (Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {};

export const BUILD_TARGET: "rider" | "driver" =
  extra.buildTarget === "driver" ? "driver" : "rider";
