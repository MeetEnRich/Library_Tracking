/**
 * Generates a clean token string based on zone name
 */
function generateZoneToken(name) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `ZONE_${cleanName}_FULAFIA`;
}

/**
 * Validates if the token string matches the FULafia pattern
 */
function isValidTokenPattern(token) {
  return typeof token === 'string' && token.startsWith('ZONE_') && token.endsWith('_FULAFIA');
}

module.exports = {
  generateZoneToken,
  isValidTokenPattern
};
