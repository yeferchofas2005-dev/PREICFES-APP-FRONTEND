import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Optionally check if the user role matches what's needed for this route
    // by passing data in the route definition, but for now we just check auth.
    return true;
  }

  return router.createUrlTree(['/login']);
};
