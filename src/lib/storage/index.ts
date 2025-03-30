import { get, set, del } from 'idb-keyval';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'your-secret-key-123'; // In production, this should be an environment variable

export class SecureStorage {
  private static encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  private static decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  static async getData(key: string): Promise<any> {
    try {
      const encryptedData = await get(key);
      if (!encryptedData) return null;
      return this.decrypt(encryptedData);
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  static async setData(key: string, value: any): Promise<void> {
    try {
      const encryptedData = this.encrypt(value);
      await set(key, encryptedData);
    } catch (error) {
      console.error('Error setting data:', error);
    }
  }

  static async removeData(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }
}