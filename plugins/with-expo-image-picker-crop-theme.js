const { AndroidConfig, withAndroidColors, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const LIGHT_COLORS = {
  expoCropToolbarColor: "#FFFFFFFF",
  expoCropToolbarIconColor: "#11181C",
  expoCropToolbarActionTextColor: "#11181C",
  expoCropBackButtonIconColor: "#11181C",
  expoCropBackgroundColor: "#FFFFFFFF",
};

const DARK_COLORS = {
  expoCropToolbarColor: "#FF151718",
  expoCropToolbarIconColor: "#FFFFFFFF",
  expoCropToolbarActionTextColor: "#FFFFFFFF",
  expoCropBackButtonIconColor: "#FFFFFFFF",
  expoCropBackgroundColor: "#FF151718",
};

function toColorXml(colors) {
  const entries = Object.entries(colors)
    .map(([name, value]) => `  <color name="${name}">${value}</color>`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${entries}\n</resources>\n`;
}

function writeResourceFile(projectRoot, directoryName, fileName, contents) {
  const resourceDirectory = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "res",
    directoryName,
  );

  fs.mkdirSync(resourceDirectory, { recursive: true });
  fs.writeFileSync(path.join(resourceDirectory, fileName), contents);
}

module.exports = function withExpoImagePickerCropTheme(config) {
  config = withAndroidColors(config, (configWithColors) => {
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      {
        name: "expoCropToolbarColor",
        value: LIGHT_COLORS.expoCropToolbarColor,
      },
    );
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      {
        name: "expoCropToolbarIconColor",
        value: LIGHT_COLORS.expoCropToolbarIconColor,
      },
    );
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      {
        name: "expoCropToolbarActionTextColor",
        value: LIGHT_COLORS.expoCropToolbarActionTextColor,
      },
    );
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      {
        name: "expoCropBackButtonIconColor",
        value: LIGHT_COLORS.expoCropBackButtonIconColor,
      },
    );
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      {
        name: "expoCropBackgroundColor",
        value: LIGHT_COLORS.expoCropBackgroundColor,
      },
    );
    return configWithColors;
  });

  return withDangerousMod(config, [
    "android",
    async (configWithDangerousMod) => {
      writeResourceFile(
        configWithDangerousMod.modRequest.projectRoot,
        "values-night",
        "expo-image-picker-crop-theme.xml",
        toColorXml(DARK_COLORS),
      );

      return configWithDangerousMod;
    },
  ]);
};
