import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Response } from '@app/core/models/response-model/response.model';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/service/authentication-service/auth.service';
import { CommonModule } from '@angular/common';
import { Signin } from '@app/core/models/signin-model/signin.model';
import { LogoService } from '@app/core/service/logo-service/logo.service';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
})
export class SigninComponent implements OnInit {
  submitted = false;
  error = '';
  loading = false;
  hide = true;
  logoUrl: string;
  phone: string = 'Teléfono';
  password: string = 'Contraseña';
  remember: string = 'Recordar';
  forgot: string = 'Cambiar contraseña';
  signin: string = 'Iniciar sesión';
  passwordIsRequerid = 'La contraseña es requerida.';
  userNameIsRequerid = 'El usuario es requerido.';
  passwordErrorMessage =
    'La contraseña debe tener al menos 6 y un máximo de 15 caracteres';
  userNameErrorMessage = 'El nombre de usuario no es válido';
  showPassword: boolean = false;
  readonly navbarIcon = 'assets/exito-logo.svg';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService,
    private readonly logoService: LogoService,
    private readonly translate: TranslateService,
    private readonly deviceService: DeviceDetectorService,
  ) {}

  ngOnInit() {
    // Verificar si el usuario ya está logueado usando signals
    if (this.authService.isLoggedIn()) {
      this.redirectByRole(this.authService.userAffiliate()?.role?.name);
      return;
    }

    this.getTheme();
    this.setLabels();
    this.setErrorMessages();

    // Suscribirse a cambios de idioma
    this.translate.onLangChange.subscribe(() => {
      this.setLabels();
      this.setErrorMessages();
    });
  }

  authLogin = new FormGroup({
    remeber: new FormControl('', []),
    phone: new FormControl('', [Validators.required]),
    pwd: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(15),
    ]),
  });

  setLabels() {
    if (this.translate.getCurrentLang() != undefined) {
      this.phone = this.translate.instant('SIGNIN.PHONE.TEXT');
      this.password = this.translate.instant('SIGNIN.PASSWORD.TEXT');
      this.remember = this.translate.instant('SIGNIN.REMEMBER-ME.TEXT');
      this.forgot = this.translate.instant('SIGNIN.FORGOT-PASS.TEXT');
      this.signin = this.translate.instant('SIGNIN.TITLE.TEXT');
    }
  }

  setErrorMessages() {
    if (this.translate.getCurrentLang() != undefined) {
      this.passwordIsRequerid = this.translate.instant(
        'SIGNIN.PASS-IS-REQUIRED.TEXT',
      );
      this.userNameIsRequerid = this.translate.instant(
        'SIGNIN.USER-NAME-IS-REQUIRED.TEXT',
      );
      this.passwordErrorMessage = this.translate.instant(
        'SIGNIN.PASS-MESSAGE-ERROR.TEXT',
      );
      this.userNameErrorMessage = this.translate.instant(
        'SIGNIN.USER-NAME-MESSAGE-ERROR.TEXT',
      );
    }
  }

  loginSubmitted() {
    let signin = new Signin();
    this.submitted = true;
    this.error = '';
    signin.phone = this.authLogin.value.phone;
    signin.password = this.authLogin.value.pwd;

    if (signin.phone === '' || signin.password === '') {
      return;
    }
    this.loading = true;

    this.authService.loginUser(signin).subscribe((response: Response) => {
      if (response.success) {
        // Determinar ruta según el rol del usuario
        const roleName = response.data.user?.role?.name?.toLowerCase();

        this.redirectByRole(roleName);
      } else {
        this.showError(response.message);
      }
      this.loading = false;
    });
  }

  showSuccess(message: string) {
    this.toastr.success(message, 'Success!');
  }

  showError(message: string) {
    this.toastr.error(message, 'Error!');
  }

  get f() {
    return this.authLogin.controls;
  }

  get Phone(): FormControl {
    return this.authLogin.get('phone') as FormControl;
  }

  get Pwd(): FormControl {
    return this.authLogin.get('pwd') as FormControl;
  }

  getTheme() {
    this.logoUrl = this.logoService.getLogoSrc();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private redirectByRole(roleName?: string | null): void {
    const normalizedRole = roleName?.toLowerCase();
    const targetRoute =
      normalizedRole === 'admin' ? '/admin/home-admin' : '/app/home';

    this.router.navigate([targetRoute]).then();
  }
}
