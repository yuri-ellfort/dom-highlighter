declare module '*.css' {
	const content: string;
	export default content;
}

declare module '*.html?raw' {
	const value: string;
	export default value;
}

declare module "*.scss?inline" {
	const content: string;
	export default content;
}
