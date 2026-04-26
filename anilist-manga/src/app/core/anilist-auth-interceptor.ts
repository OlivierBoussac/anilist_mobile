import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { anilistConfig } from './anilist-config';

export const anilistAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  if (!request.url.startsWith(anilistConfig.apiUrl)) {
    return next(request);
  }

  const token = authService.token();
  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
