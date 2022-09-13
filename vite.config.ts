import { defineConfig } from "vite";
import { fileURLToPath } from 'node:url';
import { viteStaticCopy } from "vite-plugin-static-copy";
import minifyHtml from "./src/plugins/minifyHtml";

export default defineConfig({
	plugins: [
		minifyHtml(),
		viteStaticCopy({
			targets: [
				{
					src: './src/_locales',
					dest: '.'
				}
			]
		}),
	],
	build: {
		assetsDir: '.',
		outDir: 'dist',
		rollupOptions: {
			input: {
				background: './src/background.ts',
			},
			output: {
				entryFileNames: '[name].js'
			},
		},
	},
})
