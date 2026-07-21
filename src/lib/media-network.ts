function configuredHosts(envName: string): Set<string> {
  const hosts = (process.env[envName] || '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length) throw new Error(`${envName} must contain at least one trusted hostname`);
  return new Set(hosts);
}

export function requireAllowedHttpsUrl(value: string, envName: string, label: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label} must be an HTTPS URL without embedded credentials`);
  if (!configuredHosts(envName).has(url.hostname.toLowerCase())) throw new Error(`${label} host is not allowlisted by ${envName}`);
  return url;
}

export function requireProviderUrl(value: string): URL {
  return requireAllowedHttpsUrl(value, 'MEDIA_PROVIDER_HOST_ALLOWLIST', 'media provider URL');
}

export function requireObjectUrl(value: string): URL {
  return requireAllowedHttpsUrl(value, 'MEDIA_OBJECT_HOST_ALLOWLIST', 'media object URL');
}
