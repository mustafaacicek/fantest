import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  console.log('Production mode enabled');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
