export const settings = {
  // Astro 2+ uses this value as-is, so the trailing slash has to be in the string.
  // Source: https://docs.astro.build/en/guides/upgrade-to/v2/#changed-astrosite-trailing-slash
  site: 'https://nocnoc31.github.io/',
  // Trailing slash keeps import.meta.env.BASE_URL as `/Blog_/`, matching Astro 1.
  // Source: https://docs.astro.build/en/guides/upgrade-to/v3/#changed-default-importmetaenvbase_url-trailingslash
  base: '/Blog_/',
  name: 'Simple Blog',
  title: 'Site title',
  description: 'Site description',
  showLittleSticksPlug: true,
}