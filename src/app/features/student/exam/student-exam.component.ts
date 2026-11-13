import {
  Component, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../../core/services/exam.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AreaExamen, PreguntaExamen, RespuestaLocal, RespuestaEnvio
} from '../../../core/models/exam.models';
import { OptionLetterPipe } from '../../../core/pipes/option-letter.pipe';

type Phase = 'code' | 'loading' | 'exam' | 'saving' | 'done';

@Component({
  selector: 'app-student-exam',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OptionLetterPipe],
  templateUrl: './student-exam.component.html',
  styleUrl: './student-exam.component.css'
})
export class StudentExamComponent implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private examSvc  = inject(ExamService);
  private authSvc  = inject(AuthService);
  private fb       = inject(FormBuilder);

  // ── Identificadores ───────────────────────────────────────────────────────
  idSimulacro = 0;
  simulacroNombre = signal('Simulacro Saber 11°');

  // ── Fases ─────────────────────────────────────────────────────────────────
  phase = signal<Phase>('code');
  errorMsg = signal('');
  isSaving = signal(false);

  // ── Formulario de código de acceso ────────────────────────────────────────
  codeForm = this.fb.group({
    codigoAcceso: ['', [Validators.required]]
  });

  // ── Áreas y preguntas ─────────────────────────────────────────────────────
  areas         = signal<AreaExamen[]>([]);
  areaActualIdx = signal(0);
  preguntas     = signal<PreguntaExamen[]>([]);
  preguntaIdx   = signal(0);
  loadingPregs  = signal(false);

  /** Cache lazy: Map<idArea, PreguntaExamen[]> — solo carga lo que se visita */
  private preguntasCache = new Map<number, PreguntaExamen[]>();

  /** Respuestas locales: signal de Map<idArea, Map<idPregunta, RespuestaLocal>> para reactividad total */
  respuestasLocales = signal<Map<number, Map<number, RespuestaLocal>>>(new Map());

  /** Timestamp de cuando se mostró la pregunta actual (para calcular tiempo) */
  private questionStartTime = 0;

  // ── Cronómetro ─────────────────────────────────────────────────────────────
  timerSeconds = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  timerDisplay = computed(() => {
    const s = this.timerSeconds();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  });

  // ── Computed helpers ───────────────────────────────────────────────────────
  areaActual = computed(() => this.areas()[this.areaActualIdx()]);

  preguntaActual = computed(() => this.preguntas()[this.preguntaIdx()]);

  respuestaActual = computed(() => {
    const area = this.areaActual();
    const preg = this.preguntaActual();
    if (!area || !preg) return null;
    return this.respuestasLocales().get(area.idArea)?.get(preg.idPregunta) ?? null;
  });

  respondidas = computed(() => {
    const area = this.areaActual();
    if (!area) return 0;
    return this.respuestasLocales().get(area.idArea)?.size ?? 0;
  });

  progresoArea = computed(() => {
    const area = this.areaActual();
    if (!area || area.totalPreguntas === 0) return 0;
    return Math.round((this.respondidas() / area.totalPreguntas) * 100);
  });

  isLastArea = computed(() => {
    return this.areaActualIdx() === this.areas().length - 1;
  });

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.idSimulacro = Number(this.route.snapshot.paramMap.get('idSimulacro'));
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ── Paso 1: Enviar código de acceso ───────────────────────────────────────
  submitCode(): void {
    if (this.codeForm.invalid) { this.codeForm.markAllAsTouched(); return; }
    const codigo = this.codeForm.value.codigoAcceso!.trim();
    this.errorMsg.set('');
    this.phase.set('loading');

    this.examSvc.iniciarSimulacro(this.idSimulacro, codigo).subscribe({
      next: () => this.loadAreas(),
      error: (err) => {
        this.phase.set('code');
        if (err.status === 400) {
          this.errorMsg.set('Código de acceso incorrecto. Verifica e intenta de nuevo.');
        } else if (err.status === 409) {
          this.errorMsg.set('Ya finalizaste este simulacro. No puedes volver a realizarlo.');
        } else {
          this.errorMsg.set('Error al iniciar el simulacro. Intenta de nuevo.');
        }
      }
    });
  }

  // ── Paso 2: Cargar áreas ──────────────────────────────────────────────────
  private loadAreas(): void {
    this.examSvc.getAreas(this.idSimulacro).subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.startTimer();
        this.phase.set('exam');
        // Carga lazy la primera área
        this.selectArea(0);
      },
      error: () => {
        this.phase.set('code');
        this.errorMsg.set('Error al cargar las áreas del examen.');
      }
    });
  }

  // ── Paso 3: Seleccionar área (carga lazy) ─────────────────────────────────
  selectArea(idx: number): void {
    const area = this.areas()[idx];
    if (!area) return;

    this.areaActualIdx.set(idx);
    this.preguntaIdx.set(0);

    // Verifica cache antes de hacer la petición
    if (this.preguntasCache.has(area.idArea)) {
      this.preguntas.set(this.preguntasCache.get(area.idArea)!);
      this.markQuestionStart();
      return;
    }

    this.loadingPregs.set(true);
    this.preguntas.set([]);
    this.examSvc.getPreguntas(this.idSimulacro, area.idArea).subscribe({
      next: (pregs) => {
        this.preguntasCache.set(area.idArea, pregs); // cachea para no re-pedir
        this.preguntas.set(pregs);
        this.loadingPregs.set(false);
        this.markQuestionStart();
      },
      error: () => {
        this.loadingPregs.set(false);
        this.errorMsg.set('Error al cargar las preguntas. Intenta de nuevo.');
      }
    });
  }

  // ── Registrar respuesta localmente (SIN petición HTTP) ────────────────────
  seleccionarOpcion(idOpcion: number): void {
    const area = this.areaActual();
    const preg = this.preguntaActual();
    if (!area || !preg) return;

    const tiempo = Math.floor((Date.now() - this.questionStartTime) / 1000);

    const actualMap = this.respuestasLocales();
    if (!actualMap.has(area.idArea)) {
      actualMap.set(area.idArea, new Map());
    }
    actualMap.get(area.idArea)!.set(preg.idPregunta, {
      idOpcion,
      tiempoRespuestaSegundos: tiempo
    });

    console.log(`[Selección] Pregunta ID: ${preg.idPregunta}, Opción seleccionada ID: ${idOpcion}`);

    // Al actualizar el signal con una nueva referencia del Map, Angular detectará el cambio y disparará la reactividad inmediatamente
    this.respuestasLocales.set(new Map(actualMap));
  }

  // ── Navegación de preguntas ───────────────────────────────────────────────
  prevPregunta(): void {
    if (this.preguntaIdx() > 0) {
      this.preguntaIdx.update(i => i - 1);
      this.markQuestionStart();
    }
  }

  nextPregunta(): void {
    if (this.preguntaIdx() < this.preguntas().length - 1) {
      this.preguntaIdx.update(i => i + 1);
      this.markQuestionStart();
    } else {
      // Evitar doble envío accidental si ya se está guardando
      if (this.isSaving()) return;

      // Fin del área actual. Guardamos respuestas y pasamos al siguiente área o finalizamos.
      const area = this.areaActual();
      if (!area) return;

      this.isSaving.set(true);
      const mapaArea = this.respuestasLocales().get(area.idArea);
      const respuestas: RespuestaEnvio[] = [];
      if (mapaArea) {
        mapaArea.forEach((resp, idPregunta) => {
          respuestas.push({ idPregunta, idOpcion: resp.idOpcion, tiempoRespuestaSegundos: resp.tiempoRespuestaSegundos });
        });
      }

      this.examSvc.guardarRespuestasArea(this.idSimulacro, area.idArea, { respuestas }).subscribe({
        next: () => {
          this.isSaving.set(false);
          // Limpiamos del mapa local las respuestas ya guardadas de este área para evitar re-enviarlas en finalizarSimulacro
          this.respuestasLocales().delete(area.idArea);
          this.respuestasLocales.set(new Map(this.respuestasLocales()));

          if (this.isLastArea()) {
            this.finalizarSimulacro();
          } else {
            this.selectArea(this.areaActualIdx() + 1);
          }
        },
        error: () => {
          this.isSaving.set(false);
          alert('Hubo un error al guardar tus respuestas. Intenta de nuevo.');
        }
      });
    }
  }

  private markQuestionStart(): void {
    this.questionStartTime = Date.now();
  }

  // ── Paso 4: Guardar respuestas de área en lote ────────────────────────────
  saveAreaRespuestas(idArea: number, showFeedback: boolean): void {
    const mapaArea = this.respuestasLocales().get(idArea);
    if (!mapaArea || mapaArea.size === 0) return;

    const respuestas: RespuestaEnvio[] = [];
    mapaArea.forEach((resp, idPregunta) => {
      respuestas.push({ idPregunta, idOpcion: resp.idOpcion, tiempoRespuestaSegundos: resp.tiempoRespuestaSegundos });
    });

    if (showFeedback) this.isSaving.set(true);

    this.examSvc.guardarRespuestasArea(this.idSimulacro, idArea, { respuestas }).subscribe({
      next: () => {
        if (showFeedback) this.isSaving.set(false);
        this.respuestasLocales().delete(idArea);
        this.respuestasLocales.set(new Map(this.respuestasLocales()));
      },
      error: () => { if (showFeedback) this.isSaving.set(false); }
    });
  }

  // ── Paso 5: Finalizar simulacro ───────────────────────────────────────────
  finalizarSimulacro(): void {
    if (!confirm('¿Estás seguro de que deseas finalizar el simulacro?')) return;

    this.phase.set('saving');
    this.stopTimer();

    // Guarda todas las áreas que tengan respuestas pendientes
    const saves: Array<Promise<void>> = [];
    this.areas().forEach(area => {
      const mapa = this.respuestasLocales().get(area.idArea);
      if (mapa && mapa.size > 0) {
        const respuestas: RespuestaEnvio[] = [];
        mapa.forEach((r, idPregunta) => {
          respuestas.push({ idPregunta, idOpcion: r.idOpcion, tiempoRespuestaSegundos: r.tiempoRespuestaSegundos });
        });
        const p = new Promise<void>((resolve) => {
          this.examSvc.guardarRespuestasArea(this.idSimulacro, area.idArea, { respuestas })
            .subscribe({
              next: () => {
                this.respuestasLocales().delete(area.idArea);
                resolve();
              },
              error: () => resolve()
            });
        });
        saves.push(p);
      }
    });

    Promise.all(saves).then(() => {
      this.respuestasLocales.set(new Map(this.respuestasLocales()));
      this.examSvc.finalizarSimulacro(this.idSimulacro).subscribe({
        next: () => this.phase.set('done'),
        error: () => {
          this.phase.set('exam');
          this.startTimer();
          this.errorMsg.set('Error al finalizar. Intenta de nuevo.');
        }
      });
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/student']);
  }

  // ── Cronómetro ─────────────────────────────────────────────────────────────
  private startTimer(): void {
    this.timerSeconds.set(0);
    this.timerInterval = setInterval(() => {
      this.timerSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ── Helpers de template ────────────────────────────────────────────────────
  respondiasPorArea(idArea: number): number {
    return this.respuestasLocales().get(idArea)?.size ?? 0;
  }

  formatAreaName(nombre: string): string {
    return nombre.split(' ')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}
