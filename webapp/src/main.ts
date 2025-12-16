import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { App } from './app/app.component';

bootstrapApplication(App).catch(err => console.error(err));
