import { describe, it, expect } from 'vitest';
import { DEFAULT_JEWELLERY_CONFIG } from './tenant-config';

describe('DEFAULT_JEWELLERY_CONFIG', () => {
  it('has correct structure', () => {
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('name');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('tagline');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('logo');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('primaryColor');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('accentColor');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('fontFamily');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('currency');
    expect(DEFAULT_JEWELLERY_CONFIG).toHaveProperty('locale');
  });

  it('has Zainab Jewellers branding', () => {
    expect(DEFAULT_JEWELLERY_CONFIG.name).toBe('Zainab Jewellers');
    expect(DEFAULT_JEWELLERY_CONFIG.tagline).toBe('Timeless Luxury');
    expect(DEFAULT_JEWELLERY_CONFIG.logo).toBe('💎');
  });

  it('has valid color codes', () => {
    expect(DEFAULT_JEWELLERY_CONFIG.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    expect(DEFAULT_JEWELLERY_CONFIG.accentColor).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('has INR currency', () => {
    expect(DEFAULT_JEWELLERY_CONFIG.currency).toBe('INR');
    expect(DEFAULT_JEWELLERY_CONFIG.locale).toBe('en-IN');
  });

  it('injects CSS variables correctly', () => {
    expect(DEFAULT_JEWELLERY_CONFIG.primaryColor).toBe('#B8860B');
    expect(DEFAULT_JEWELLERY_CONFIG.accentColor).toBe('#8B0000');
    expect(DEFAULT_JEWELLERY_CONFIG.fontFamily).toContain('Georgia');
  });
});
