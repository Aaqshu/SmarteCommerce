import { Injectable } from '@nestjs/common';

/**
 * GSTIN structure (15 chars):
 *  [1-2] State code (01-37, plus 97 for Union Territory without legislature)
 *  [3-12] PAN (10 chars: 5 letters, 4 digits, 1 letter)
 *  [13] Entity code (1-9, A-Z excluding X)
 *  [14] 'Z' (default)
 *  [15] Checksum (mod-36, position-weighted)
 *
 * Free validation — no third-party API. Format + checksum only.
 */
@Injectable()
export class GstinValidator {
  private readonly STATE_CODES = new Set([
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37', '97',
  ]);

  private readonly ENTITY_CODES = new Set([
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'Y', 'Z',
  ]);

  private readonly ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  isValid(gstin: string | null | undefined): boolean {
    if (!gstin || typeof gstin !== 'string') return false;

    const g = gstin.trim().toUpperCase();
    if (g.length !== 15) return false;

    // State code
    if (!this.STATE_CODES.has(g.slice(0, 2))) return false;

    // PAN: positions 3-12 — 5 letters, 4 digits, 1 letter
    const pan = g.slice(2, 12);
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return false;

    // Entity code
    if (!this.ENTITY_CODES.has(g[12])) return false;

    // Position 14 must be Z
    if (g[13] !== 'Z') return false;

    // Checksum (mod-36, position-weighted)
    return this.checkChecksum(g);
  }

  private checkChecksum(gstin: string): boolean {
    const factor = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 14; i++) {
      const charValue = this.ALPHABET.indexOf(gstin[i]);
      const product = charValue * factor[i];
      sum += Math.floor(product / 36) + (product % 36);
    }

    const remainder = sum % 36;
    const checksum = remainder === 0 ? 0 : 36 - remainder;
    const expectedChar = this.ALPHABET[checksum];

    return gstin[14] === expectedChar;
  }
}
