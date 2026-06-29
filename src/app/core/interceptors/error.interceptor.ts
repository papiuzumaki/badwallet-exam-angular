import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Une erreur est survenue';

      if (err.error?.message) {
        message = err.error.message;
      } else if (err.status === 404) {
        message = 'Ressource introuvable';
      } else if (err.status === 400) {
        message = err.error?.message ?? 'Requête invalide';
      } else if (err.status === 0) {
        message = 'Impossible de contacter le serveur';
      }

      toast.error(message);
      return throwError(() => err);
    })
  );
};
