export async function getBrowserFingerprint(): Promise<string> {
  const { userAgent, language, platform } = navigator;
  const screenInfo = `${screen.width}x${screen.height}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fingerprint = [
    userAgent,
    language,
    platform,
    screenInfo,
    timeZone,
  ].join("||");

  return hashString(fingerprint);
}

function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return (hash >>> 0).toString(16);
}
