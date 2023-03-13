# MIK ID SSO Client


> ### Affinity Lab / SvelteKit
> Author: Gergely Laborci (gergely@laborci.hu)
>  ###### This project is licensed under the MIT License

## Description

A PTE MIK SSO ID rendszeréhez készült kliens SvelteKit keretrendszerhez

## Usage

### Client service

Először is készítsd el a sso client szolgáltatást:

```ts
/// $lib/services/sso-client.ts

import {type NeptunUser, SSOClient} from "@affinity-lab/sk-mik-id-sso-client";
import type {RequestEvent} from "@sveltejs/kit";

export let ssoClient = new SSOClient(
	'https://id.mik.pte.hu/auth-request',
	'https://id.mik.pte.hu/logout',
	"your-application-id",
	"your-application-secret",
	(event: RequestEvent, user: NeptunUser) => event.locals.session.user = user,
	(event: RequestEvent) => event.locals.session.user = undefined
)
```

A konstruktor szignatúrája:
```ts
constructor(
	private mikIdAuthRequestUrl: string, // mik-id belépés kérelmező link
	private mikIdLogoutUrl: string, // mik-id kilépés link
	private appId: string, // a mik-id alkalmazás azonosítója
	private appKey: string, // a mik-id alkalmazás titkos kulcsa
	private onAuth?: (event: RequestEvent, user: NeptunUser) => void, // sikeres belépéskor mi történjen
	private onSignOut?: (event: RequestEvent) => void // logout eseménykor mi történjen
)
```

Tipikusan a belépéskor egy session változóba beírjuk a visszakapott Neptun felhasználót, kilépés esetén pedig kitöröljük azt a sessionből!

### Endpoint

Jellemzően így néz ki egy sso kezelő végpont:

```ts
/// src/routes/sso/[action]/+server.ts

import type {RequestEvent} from '@sveltejs/kit';
import {error} from "@sveltejs/kit";
import {ssoClient} from "$lib/services/sso-client";

export async function GET(event: RequestEvent) {
	switch (event.params["action"]) {
		case "sign-in":
			return ssoClient.signIn(event, event.url.origin + "/sso/authenticated");
		case "authenticated":
			return ssoClient.authenticated(event, event.url.origin, event.url.origin);
		case "sign-out":
			return ssoClient.signOut(event, event.url.origin);
	}
	throw error(404, {message: 'Not found'});
}
```

A kliens három metódusa három különböző hívásra válaszol:

#### signIn

Ennek az endpointnak a hívásával lehet kezdeményezni a belépést.

```ts
signIn(
	event: RequestEvent, 
	onAuthUrl: string,
	// az "authenticated" endpointhoz tartozó url
	groups: Array<string> | undefined = undefined
	// a belépéshez megkövetelt jogosultságok
):void
```

#### authenticated

Ez a végpont kerül meghívásra a MIK-ID szerver által, az authentikáció végeztével. Sikeres authentikációt követően meghívja a konstruktorban megadott `onAuth` metódust, majd tovább megy a `redirectOnSuccess` url-re. 

```ts
authenticated(
	event: RequestEvent,
	redirectOnSuccess: string, 
	redirectOnError: string
):void
```

#### signOut

Ez nem csak az alkalmazásból lépteti ki a felhasználót, de a MIK-ID szerverről is.

```ts
signOut(
	event: RequestEvent,
	redirectTo: string
	// az oldalnak a címe, hogy hova térjen vissza a rendszer a kilépést követően
):void
```

### Endpointok meghívása

Fontos, hogy a végpont meghívásakor közöljük a sveltekit-tel, hogy új page betöltést szeretnénk (`data-sveltekit-reload`)

```sveltehtml
<a href="/sso/sign-in" data-sveltekit-reload>MIK:SSO - SIGN IN</a> 
<a href="/sso/sign-out" data-sveltekit-reload>MIK:SSO - SIGN OUT</a>
```
