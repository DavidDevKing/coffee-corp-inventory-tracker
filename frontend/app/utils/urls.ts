export function getSubdomainUrl(subdomain: 'main' | 'admin', path: string = '') {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = rootDomain?.startsWith('localhost') ? 'http' : 'https';
  
  // Clean the path to ensure it starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (subdomain === 'main') {
    return `${protocol}://${rootDomain}${cleanPath}`;
  }

  return `${protocol}://${subdomain}.${rootDomain}${cleanPath}`;
}