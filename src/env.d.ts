/// <reference types="astro/client" />

type AuthSession = import('./lib/auth').AuthSession;

declare namespace App {
  interface Locals {
    user: AuthSession['user'] | null;
    session: AuthSession['session'] | null;
  }
}
