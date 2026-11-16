import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const roleName = this.authService.currentUser()?.rol?.nombre;
      const targetRoute = this.authService.getHomeRouteByRole(roleName);
      if (targetRoute !== '/auth/login') {
        this.router.navigate([targetRoute]);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = {
      correo: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const targetRoute = this.authService.getHomeRouteByRole(res.usuario?.rol?.nombre);
        if (targetRoute === '/auth/login') {
          this.errorMessage.set('Tu usuario no tiene un rol válido asignado.');
          return;
        }
        this.router.navigate([targetRoute]);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.errorMessage.set('Correo o contraseña incorrectos, o el usuario está inactivo.');
        } else {
          this.errorMessage.set('Error al conectar con el servidor. Intenta nuevamente.');
        }
      }
    });
  }
}
