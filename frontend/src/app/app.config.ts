import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { demoApiInterceptor } from './core/demo/demo-api.interceptor';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // authInterceptor vem primeiro para anexar o token; o demoApiInterceptor responde
    // localmente no modo demo (e é transparente fora dele), já enxergando o Authorization.
    provideHttpClient(withInterceptors([authInterceptor, demoApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};
