import {redirect, type RequestEvent} from "@sveltejs/kit";
import type {NeptunUser} from "./neptun-user";
import jwt from "jsonwebtoken";

export default class SSOClient {
	constructor(
		private mikIdAuthRequestUrl: string,
		private mikIdLogoutUrl: string,
		private appId: string,
		private appKey: string,
		private onSignOut?: (event: RequestEvent) => void,
		private onAuth?: (event: RequestEvent, user: NeptunUser) => void
	) {

	}

	signIn(event: RequestEvent, onAuthUrl: string, groups: Array<string> | undefined = undefined) {
		let token = this.createToken(onAuthUrl, Array.isArray(groups) ? {groups} : {});
		throw redirect(303, `${this.mikIdAuthRequestUrl}?token=${token}`);
	}
	signOut(event: RequestEvent, redirectTo: string) {
		let token = this.createToken(redirectTo);
		if (typeof this.onSignOut === "function") this.onSignOut(event);
		throw redirect(303, `${this.mikIdLogoutUrl}?token=${token}`);
	}
	authenticated(event: RequestEvent, redirectOnSuccess: string, redirectOnError: string) {
		let token = event.url.searchParams.get("token");
		if (token) {
			let payload = jwt.verify(token, this.appKey);
			if (payload) {
				let data = payload as { user: NeptunUser };
				if (typeof this.onAuth === "function") this.onAuth(event, data.user);
				throw redirect(303, redirectOnSuccess);
			}
		}
		throw redirect(303, redirectOnError);
	}

	createToken(url: string, payload: { [p: string]: any } = {}): string {
		return jwt.sign({...payload, "return-url": url}, this.appKey, {
			issuer: this.appId,
			expiresIn: "10m"
		})
	}

}