module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === 'development';

  return {
    ...config,
    name: isDevelopment ? '포켓치 개발용' : '포켓치',
    scheme: isDevelopment ? 'poketch-dev' : config.scheme,
    android: {
      ...config.android,
      package: isDevelopment
        ? 'com.jaehyuk.poketch.dev'
        : 'com.jaehyuk.poketch',
    },
  };
};
