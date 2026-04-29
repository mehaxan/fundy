import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);

  const addToken = (r: HttpRequest<unknown>) => {
    const token = auth.accessToken;
    return token
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : r;
  };

  return next(addToken(req)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes("/auth/")) {
        return auth.refresh().pipe(
          switchMap(() => next(addToken(req))),
          catchError((refreshErr) => throwError(() => refreshErr)),
        );
      }
      return throwError(() => err);
    }),
  );
};
