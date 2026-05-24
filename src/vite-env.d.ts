/// <reference types="vite/client" />

declare module "virtual:city-catalog" {
	const catalog: Array<{
		key: string;
		label: string;
		jsonPath: string;
		imagePath?: string;
	}>;

	export default catalog;
}
