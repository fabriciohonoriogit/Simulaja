import { describe, it, expect } from 'vitest';
import { normalizeStatus } from '../components/admin/funil/constants';

describe('normalizeStatus', () => {
  it('should return "novo_lead" for undefined or null', () => {
    expect(normalizeStatus(null)).toBe('novo_lead');
    expect(normalizeStatus('')).toBe('novo_lead');
  });

  it('should normalize known statuses correctly', () => {
    expect(normalizeStatus('novo_lead')).toBe('novo_lead');
    expect(normalizeStatus('novo')).toBe('novo_lead');
    expect(normalizeStatus('contato')).toBe('primeiro_contato');
    expect(normalizeStatus('proposta')).toBe('simulacao_enviada');
    expect(normalizeStatus('negociacao')).toBe('negociacao');
    expect(normalizeStatus('venda_fechada')).toBe('fechado');
  });

  it('should return "novo_lead" for unknown statuses', () => {
    expect(normalizeStatus('status_invalido_qualquer')).toBe('novo_lead');
  });
});
