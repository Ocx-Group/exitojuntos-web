import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

/**
 * Recorte de imágenes sin dependencias externas. El usuario hace zoom y
 * arrastra la imagen dentro de un marco de proporción fija; al confirmar se
 * exporta a un tamaño objetivo comprimido (JPEG), evitando archivos pesados
 * y dimensiones incorrectas para logo/banner.
 */
@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss'],
})
export class ImageCropperDialogComponent {
  /** Data URL de la imagen original a recortar. */
  @Input({ required: true }) src!: string;
  /** Relación de aspecto del recorte (ancho / alto). */
  @Input() aspect = 1;
  /** Ancho del resultado en píxeles (el alto se deriva del aspecto). */
  @Input() outputWidth = 256;
  /** Muestra el marco circular (para logos). */
  @Input() round = false;
  @Input() title = 'Recortar imagen';

  @Output() cropped = new EventEmitter<Blob>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('imgEl') private readonly imgEl!: ElementRef<HTMLImageElement>;

  protected readonly loaded = signal(false);
  protected readonly zoom = signal(1);
  protected readonly offsetX = signal(0);
  protected readonly offsetY = signal(0);

  private naturalW = 0;
  private naturalH = 0;
  private baseScale = 1;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  // Viewport de visualización (px), con la proporción del recorte.
  protected readonly vw = computed(() => {
    let w = 340;
    let h = w / this.aspect;
    if (h > 340) {
      h = 340;
      w = h * this.aspect;
    }
    return Math.round(w);
  });
  protected readonly vh = computed(() => Math.round(this.vw() / this.aspect));

  protected readonly dispW = computed(
    () => this.naturalW * this.baseScale * this.zoom(),
  );
  protected readonly dispH = computed(
    () => this.naturalH * this.baseScale * this.zoom(),
  );

  protected onLoad(): void {
    const img = this.imgEl.nativeElement;
    this.naturalW = img.naturalWidth;
    this.naturalH = img.naturalHeight;
    // Escala "cover": la imagen siempre cubre el viewport.
    this.baseScale = Math.max(
      this.vw() / this.naturalW,
      this.vh() / this.naturalH,
    );
    this.zoom.set(1);
    this.centerImage();
    this.loaded.set(true);
  }

  private centerImage(): void {
    this.offsetX.set((this.vw() - this.dispW()) / 2);
    this.offsetY.set((this.vh() - this.dispH()) / 2);
  }

  protected startDrag(event: PointerEvent): void {
    if (!this.loaded()) return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  @HostListener('document:pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!this.dragging) return;
    event.preventDefault();
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.offsetX.update(v => v + dx);
    this.offsetY.update(v => v + dy);
    this.clamp();
  }

  @HostListener('document:pointerup')
  onUp(): void {
    this.dragging = false;
  }

  protected onZoom(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    // Mantener el centro del viewport al hacer zoom.
    const cx = this.vw() / 2;
    const cy = this.vh() / 2;
    const prevEff = this.baseScale * this.zoom();
    const imgCx = (cx - this.offsetX()) / prevEff;
    const imgCy = (cy - this.offsetY()) / prevEff;
    this.zoom.set(value);
    const eff = this.baseScale * this.zoom();
    this.offsetX.set(cx - imgCx * eff);
    this.offsetY.set(cy - imgCy * eff);
    this.clamp();
  }

  private clamp(): void {
    const dw = this.dispW();
    const dh = this.dispH();
    this.offsetX.set(Math.min(0, Math.max(this.vw() - dw, this.offsetX())));
    this.offsetY.set(Math.min(0, Math.max(this.vh() - dh, this.offsetY())));
  }

  protected confirm(): void {
    if (!this.loaded()) return;
    const eff = this.baseScale * this.zoom();
    const sx = -this.offsetX() / eff;
    const sy = -this.offsetY() / eff;
    const sW = this.vw() / eff;
    const sH = this.vh() / eff;

    const outW = this.outputWidth;
    const outH = Math.round(this.outputWidth / this.aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(this.imgEl.nativeElement, sx, sy, sW, sH, 0, 0, outW, outH);

    canvas.toBlob(
      blob => {
        if (blob) this.cropped.emit(blob);
      },
      'image/jpeg',
      0.85,
    );
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
