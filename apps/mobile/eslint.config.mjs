import { reactNativeConfig, configMetro } from '@cair/config/eslint/react-native';

export default [...reactNativeConfig({ tsconfigRootDir: import.meta.dirname }), configMetro];
