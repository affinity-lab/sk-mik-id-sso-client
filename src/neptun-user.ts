export interface NeptunUser {
	guid: string
	name: string
	email: string
	neptun: string
	group: string | null
	avatars: {
		'64': string | null,
		'128': string | null,
		'256': string | null,
		'512': string | null,
		'1024': string | null
	}
}