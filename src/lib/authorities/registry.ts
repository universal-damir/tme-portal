import { AuthorityConfig } from './types';
import { IFZA_CONFIG } from './ifza';
import { DET_CONFIG } from './det';

// Registry of all available authorities
const AUTHORITY_REGISTRY: Record<string, AuthorityConfig> = {
  [IFZA_CONFIG.id]: IFZA_CONFIG,
  [DET_CONFIG.id]: DET_CONFIG,
};

/**
 * Get authority configuration by ID
 */
export const getAuthorityConfig = (authorityId: string): AuthorityConfig | undefined => {
  return AUTHORITY_REGISTRY[authorityId];
};

/**
 * Get authority configuration by name (for backward compatibility)
 */
export const getAuthorityConfigByName = (authorityName: string): AuthorityConfig | undefined => {
  return Object.values(AUTHORITY_REGISTRY).find(config => config.name === authorityName);
};

/**
 * Get all available authorities
 */
export const getAllAuthorities = (): AuthorityConfig[] => {
  return Object.values(AUTHORITY_REGISTRY);
};

/**
 * Get all authority names for dropdown/select options
 */
export const getAuthorityNames = (): string[] => {
  return Object.values(AUTHORITY_REGISTRY).map(config => config.name);
};

/**
 * Check if an authority exists
 */
export const authorityExists = (authorityId: string): boolean => {
  return authorityId in AUTHORITY_REGISTRY;
};

/**
 * Register a new authority (for future extensibility)
 */
export const registerAuthority = (config: AuthorityConfig): void => {
  AUTHORITY_REGISTRY[config.id] = config;
};

// Export the registry for direct access if needed
export { AUTHORITY_REGISTRY }; 