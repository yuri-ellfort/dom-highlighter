import {minify} from 'html-minifier';
import { readFileSync } from 'fs';

const fileRegex = /\.(html\?raw)$/

export default function minifyHtml() {
	return {
		name: 'minify-html',
		transform(src: string, id: string) {
			if (fileRegex.test(id)) {
				const htmlContent = readFileSync(id.replace('?raw', ''), 'utf-8');
				const minifiedContent = minify(htmlContent, {
					collapseWhitespace: true,
					removeComments: true,
					minifyCSS: true,
					minifyJS: true
				});

				return `export default ${JSON.stringify(minifiedContent)}`
			}
		},
	};
}
