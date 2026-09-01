import { randomInt } from 'node:crypto';

const tokenCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(length = 16) {
  return Array.from(
    { length },
    () => tokenCharacters[randomInt(tokenCharacters.length)],
  ).join('');
}

export function generatePublicToken(companyCode = 'NFC') {
  const prefix = companyCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'NFC';
  return `${prefix}-${randomSegment()}`;
}
