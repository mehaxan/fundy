import { Injectable, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { tap, catchError, EMPTY } from "rxjs";
import { JwtPayload, UserRole, AuthTokens } from "@fundy/shared";

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private _accessToken = signal<string | null>(null);
  private _user = computed(() => {
    const token = this._accessToken();
    return token ? parseJwt(token) : null;
  });

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isManager = computed(() =>
    [UserRole.MANAGER, UserRole.ADMIN].includes(this._user()?.role as UserRole),
  );
  readonly isAdmin = computed(() => this._user()?.role === UserRole.ADMIN);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get accessToken(): string | null {
    return this._accessToken();
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthTokens>("/api/auth/login", { email, password })
      .pipe(
        tap((res) => {
          this._accessToken.set(res.accessToken);
          this.router.navigate(["/dashboard"]);
        }),
      );
  }

  refresh() {
    return this.http
      .post<AuthTokens>("/api/auth/refresh", {}, { withCredentials: true })
      .pipe(
        tap((res) => this._accessToken.set(res.accessToken)),
        catchError(() => {
          this.clearSession();
          return EMPTY;
        }),
      );
  }

  logout() {
    return this.http.post("/api/auth/logout", {}).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(["/auth/login"]);
      }),
      catchError(() => {
        this.clearSession();
        this.router.navigate(["/auth/login"]);
        return EMPTY;
      }),
    );
  }

  private clearSession() {
    this._accessToken.set(null);
  }
}
