import { Highlight, HighlightParams, RequestMessage } from "../interfaces/background.interfaces";
import { OpenSettingsPopupActionParams } from "../interfaces/content.interfaces";

function useContent(): void {
	const actions: Record<string, (payload?: any) => void> = {
		doHighlight,
		openSettingsPopup,
	}

	init();

	function init(): void {
		setEventsListeners();
	}

	function setEventsListeners(): void {
		chrome.runtime.onMessage.addListener((request: RequestMessage) => {
			actions[request.action]?.(request.data);
		})
	}

	function doHighlight(highlight: Highlight): void {
		document.getElementById('highlight-extension')?.remove();

		if (highlight.active) {
			document.body.insertAdjacentHTML('beforeend', createStyles(highlight.params))
		}
	}

	function openSettingsPopup(params: OpenSettingsPopupActionParams): void {
		const settingsPopupNode = document.getElementById('highlight-settings');

		if (!settingsPopupNode) {
			document.body.insertAdjacentHTML('beforeend', params.html);
			window.postMessage({
				action: 'settingsPopupReady',
				data: {
					params: params.params,
					messages: params.messages,
				}
			}, '*')
		}
	}

	function createStyles(params: HighlightParams): string {
		const mask = (params.useMask && params.mask) || params.defaultMask;
		const properties = [];

		if (['outline', 'border'].includes(params.type)) {
			properties.push(`${params.type}: ${params.size}px solid ${hexToRGBA(params.color, params.opacity)}`);
		} else {
			properties.push(`box-shadow: 0 0 0 ${params.size}px ${hexToRGBA(params.color, params.opacity)}`);
		}

		return `<style id="highlight-extension">${mask}:not(.highlight-settings):not(.highlight-settings *) { ${properties.join(';')} }</style>`
	}

	function hexToRGBA(HEX: string, opacity: number): string {
		let R = '0';
		let G = '0';
		let B = '0';

		if (HEX.length === 4) {
			R = '0x' + HEX[1] + HEX[1];
			G = '0x' + HEX[2] + HEX[2];
			B = '0x' + HEX[3] + HEX[3];
		} else if (HEX.length === 7) {
			R = '0x' + HEX[1] + HEX[2];
			G = '0x' + HEX[3] + HEX[4];
			B = '0x' + HEX[5] + HEX[6];
		}

		return `rgb(${+R},${+G},${+B},${opacity})`;
	}
}

export default useContent;
