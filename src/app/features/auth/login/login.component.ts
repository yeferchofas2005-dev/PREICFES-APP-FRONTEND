import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const credentials = {
        correo: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(credentials).subscribe({
        next: (res) => {
          this.isLoading = false;
          // Determine where to route based on role
          const roleName = res.usuario.rol.nombre;
          if (roleName === 'ESTUDIANTE') {
            this.router.navigate(['/student']);
            console.log('Login exitoso: ESTUDIANTE');
          } else if (roleName === 'PROFESOR') {
            // Future route: this.router.navigate(['/teacher']);
            console.log('Login exitoso: PROFESOR');
          } else if (roleName === 'ADMIN') {
            // Future route: this.router.navigate(['/admin']);
            console.log('Login exitoso: ADMIN');
          } else if (roleName === 'DIRECTIVO') {
            // Future route: this.router.navigate(['/director']);
            console.log('Login exitoso: DIRECTIVO');
          } else {
            console.log('Login exitoso pero rol desconocido');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Credenciales inválidas o error en el servidor.';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
