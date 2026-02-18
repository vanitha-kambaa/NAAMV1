import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleSheet, StyleProp, View } from 'react-native';

const FALLBACK_IMAGE = require('../assets/images/coconut-trees.png');

type RemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

/**
 * Renders a remote image with fallback to placeholder on 404 or any load error.
 * Shows a loading indicator while the image is loading.
 */
export function RemoteImage({ uri, style, resizeMode = 'cover' }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFailed(false);
    setLoading(!!uri?.trim());
  }, [uri]);

  const cleanUri = uri?.trim();
  const showFallback = !cleanUri || failed;
  const source = showFallback ? FALLBACK_IMAGE : { uri: cleanUri };
  const showLoadingIndicator = !showFallback && loading;

  return (
    <View style={[style, styles.container]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onError={() => setFailed(true)}
        onLoad={() => setLoading(false)}
      />
      {showLoadingIndicator && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#0f6b36" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
