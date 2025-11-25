import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UploadProgress {
  progress: number;
  snapshot: UploadTaskSnapshot;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseStorageService {
  constructor(private readonly storage: Storage) {}

  /**
   * Sube un archivo a Firebase Storage y retorna la URL de descarga
   * @param file - Archivo a subir
   * @param path - Ruta donde se guardará el archivo en Firebase Storage
   * @returns Observable con la URL de descarga del archivo
   */
  uploadFile(file: File, path: string): Observable<string> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable<string>(observer => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Se puede usar para mostrar el progreso si es necesario
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error: any) => {
          // Manejo de errores durante la carga
          console.error('Error uploading file:', error);
          observer.error(error);
        },
        () => {
          // La carga se completó exitosamente
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL: string) => {
              observer.next(downloadURL);
              observer.complete();
            })
            .catch((error: any) => {
              console.error('Error getting download URL:', error);
              observer.error(error);
            });
        },
      );
    });
  }

  /**
   * Sube un archivo y retorna tanto el progreso como la URL final
   * @param file - Archivo a subir
   * @param path - Ruta donde se guardará el archivo en Firebase Storage
   * @returns Observable con el progreso y la URL de descarga
   */
  uploadFileWithProgress(
    file: File,
    path: string,
  ): Observable<{ type: 'progress' | 'url'; value: number | string }> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable(observer => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ type: 'progress', value: progress });
        },
        (error: any) => {
          console.error('Error uploading file:', error);
          observer.error(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL: string) => {
              observer.next({ type: 'url', value: downloadURL });
              observer.complete();
            })
            .catch((error: any) => {
              console.error('Error getting download URL:', error);
              observer.error(error);
            });
        },
      );
    });
  }

  /**
   * Elimina un archivo de Firebase Storage
   * @param path - Ruta del archivo a eliminar
   * @returns Observable que se completa cuando el archivo es eliminado
   */
  deleteFile(path: string): Observable<void> {
    const storageRef = ref(this.storage, path);
    return from(deleteObject(storageRef)).pipe(
      catchError(error => {
        console.error('Error deleting file:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Sube una imagen de perfil de afiliado
   * @param file - Archivo de imagen a subir
   * @param userName - Nombre de usuario del afiliado
   * @param userId - ID del usuario
   * @returns Observable con la URL de descarga de la imagen
   */
  uploadAffiliateProfileImage(file: File, phone: string): Observable<string> {
    const filePath = `/affiliates/exitojuntos/${phone}`;
    return this.uploadFile(file, filePath);
  }

  /**
   * Genera una ruta personalizada para subir archivos
   * @param basePath - Ruta base (ej: 'documents', 'images', etc.)
   * @param fileName - Nombre del archivo
   * @param subfolders - Subcarpetas adicionales (opcional)
   * @returns Ruta completa para el archivo
   */
  generateFilePath(
    basePath: string,
    fileName: string,
    subfolders?: string[],
  ): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileNameWithTimestamp = `${timestamp}_${sanitizedFileName}`;

    if (subfolders && subfolders.length > 0) {
      return `${basePath}/${subfolders.join('/')}/${fileNameWithTimestamp}`;
    }

    return `${basePath}/${fileNameWithTimestamp}`;
  }

  /**
   * Extrae la ruta del archivo desde una URL de Firebase Storage
   * @param url - URL completa del archivo en Firebase Storage
   * @returns Ruta del archivo o null si no se puede extraer
   */
  extractPathFromUrl(url: string): string | null {
    try {
      const decodedUrl = decodeURIComponent(url);
      const pathMatch = /\/o\/(.+?)\?/.exec(decodedUrl);
      return pathMatch ? pathMatch[1] : null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }

  /**
   * Elimina un archivo usando su URL completa
   * @param url - URL completa del archivo en Firebase Storage
   * @returns Observable que se completa cuando el archivo es eliminado
   */
  deleteFileByUrl(url: string): Observable<void> {
    const path = this.extractPathFromUrl(url);
    if (!path) {
      return throwError(() => new Error('Could not extract path from URL'));
    }
    return this.deleteFile(path);
  }
}
