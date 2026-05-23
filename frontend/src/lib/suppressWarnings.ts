// Suppress Three.js Clock deprecation warning
// This is a temporary measure until react-three-fiber migrates to THREE.Timer
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('THREE.Clock') && message.includes('deprecated')) {
      return; // Suppress this specific warning
    }
    originalWarn(...args);
  };
}
