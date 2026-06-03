import { Injectable } from '@angular/core';

interface StoredReferral {
  token: string;
  savedAt: number;
}

/**
 * Guarda el token de la tienda por la que llegó el visitante (atribución
 * de venta). Persiste en localStorage con caducidad para que la
 * atribución sobreviva navegación, login y recarga.
 */
@Injectable({ providedIn: 'root' })
export class ReferralService {
  private readonly storageKey = 'store_referral';
  /** Vigencia de la atribución: 30 días. */
  private readonly ttlMs = 30 * 24 * 60 * 60 * 1000;

  /** Registra el token de tienda (no sobrescribe uno vigente: first-touch). */
  capture(token: string | null | undefined): void {
    if (!token) return;
    if (this.getToken()) return;
    const payload: StoredReferral = { token, savedAt: Date.now() };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      /* almacenamiento no disponible: la atribución se omite */
    }
  }

  /** Token vigente o null si no hay/expiró. */
  getToken(): string | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredReferral;
      if (!parsed?.token || Date.now() - parsed.savedAt > this.ttlMs) {
        this.clear();
        return null;
      }
      return parsed.token;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* noop */
    }
  }
}
