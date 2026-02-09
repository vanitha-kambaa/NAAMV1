import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const FALLBACK_IMAGE = require('../assets/images/coconut-trees.png');

type RemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

/**
 * Renders a remote image with fallback to placeholder on 404 or any load error.
 * Avoids loading loop by NOT resetting failed state on fallback image load.
 */
export function RemoteImage({ uri, style, resizeMode = 'cover' }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const cleanUri = uri?.trim();
  const showFallback = !cleanUri || failed;
  const source = showFallback ? FALLBACK_IMAGE : { uri: cleanUri };

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
