import { HighlightParams } from '../../interfaces/background.interfaces';
import { SettingsAction, SettingsFieldParam, SettingsPopupParams } from '../../interfaces/settings-popup.interfaces';

function SettingsPopup(): void {
	const name = 'highlight-settings';
	const className = `.${name}`;
	const actions: Record<string, SettingsAction> = {
		color: {
			event: 'change',
			action: setColor
		},
		size: {
			event: 'change',
			action: setSize,
		},
		opacity: {
			event: 'change',
			action: setOpacity,
		},
		type: {
			event: 'change',
			action: setType,
		},
		mask: {
			event: 'keyup',
			action: setMask,
		},
		useMask: {
			event: 'change',
			action: setMask,
		},
	};

	function init(data: SettingsPopupParams): void {
		const popup = document.getElementById(name);
		const popupHeader = popup?.querySelector<HTMLElement>(className + '__header');

		if (!popup || !popupHeader) {
			return;
		}

		const {params, messages} = data;

		Object.keys(params).forEach((paramName) => {
			const paramsKey = paramName as keyof HighlightParams;
			const field = document.getElementById(`${paramName}HighlightSettings`) as HTMLInputElement;

			if (field) {
				initField(field, {
					name: paramName,
					value: params[paramsKey],
					title: messages[paramsKey] ?? '',
				});
			}
		});

		setEventListeners();
		useDragAndDrop(popup, popupHeader);
		counter();
	}

	function initMessageListener(): void {
		window.addEventListener('message', event => {
			if (event.data.action === 'settingsPopupReady') {
				init(event.data.data);
			}
		});
	}

	function setEventListeners(): void {
		document.querySelector(className + '__close-btn')?.addEventListener('click', () => {
			document.querySelector(className)?.remove();
		});
	}

	function initField(field: HTMLInputElement, param: SettingsFieldParam): void {
		// Lang localization
		const fieldLabel = document.querySelector(`label[for="${field.id}"]`);

		if (fieldLabel) {
			fieldLabel.innerHTML = param.title;
		}

		// Value setting
		field.type === 'checkbox' ? field.checked = param.value as boolean : field.value = param.value as string;

		// Event handler setting
		if (param.name in actions) {
			field.addEventListener(actions[param.name].event, debounce(actions[param.name].action, 100));
		}
	}

	function setColor(event: Event): void {
		chrome.runtime.sendMessage({
			action: 'changeParams',
			data: {
				color: (<HTMLInputElement>event.target).value,
			}
		});
	}

	function setSize(event: Event): void {
		const target = (<HTMLInputElement>event.target);
		const size = Number(target.value);

		if (size < 1) {
			target.value = '1';
		} else if (size > 5) {
			target.value = '5';
		}

		chrome.runtime.sendMessage({
			action: 'changeParams',
			data: {
				size: target.value,
			}
		});
	}

	function setOpacity(event: Event): void {
		const target = (<HTMLInputElement>event.target);
		const size = Number(target.value);

		if (size < 0.01) {
			target.value = '0.01';
		} else if (size > 1) {
			target.value = '1';
		}

		chrome.runtime.sendMessage({
			action: 'changeParams',
			data: {
				opacity: target.value,
			}
		});
	}

	function setType(event: Event): void {
		chrome.runtime.sendMessage({
			action: 'changeParams',
			data: {
				type: (<HTMLSelectElement>event.target).value
			}
		});
	}

	function setMask(): void {
		const maskInputValue = (<HTMLInputElement>document.getElementById('maskHighlightSettings')).value;
		const maskCheckboxValue = (<HTMLInputElement>document.getElementById('useMaskHighlightSettings')).checked;

		chrome.runtime.sendMessage({
			action: 'changeParams',
			data: {
				mask: maskInputValue,
				useMask: maskCheckboxValue,
			}
		});
	}

	function counter(): void {
		const counterElements = document.querySelectorAll('.highlight-settings__counter');

		counterElements.forEach(counterElement => {
			const plusBtn = counterElement.querySelector('.highlight-settings__counterPlus') as HTMLElement;
			const minusBtn = counterElement.querySelector('.highlight-settings__counterMinus') as HTMLElement;
			const field = counterElement.querySelector('.highlight-settings__field') as HTMLInputElement;
			let currentValue = parseFloat(field.value);
			const step = parseFloat(field.step);

			plusBtn.addEventListener('click', () => {
				if (currentValue < parseFloat(field.max)) {
					currentValue = Math.min(currentValue + step, parseFloat(field.max));

					if (field.id === 'opacityHighlightSettings') {
						field.value = currentValue.toFixed(1);
					} else {
						field.value = String(currentValue);
					}

					field.dispatchEvent(new Event('change'));
				}
			});

			minusBtn.addEventListener('click', () => {
				if (currentValue > parseFloat(field.min)) {
					currentValue = Math.max(currentValue - step, parseFloat(field.min));

					if (field.id === 'opacityHighlightSettings') {
						field.value = currentValue.toFixed(1);
					} else {
						field.value = String(currentValue);
					}

					field.dispatchEvent(new Event('change'));
				}
			});
		});

	}

	function debounce<Params extends any[]>(
		func: (...args: Params) => any,
		timeout: number,
	): (...args: Params) => void {
		let timer: NodeJS.Timeout;

		return (...args: Params) => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				func(...args);
			}, timeout);
		};
	}

	function useDragAndDrop(dragElement: HTMLElement, handElement: HTMLElement): void {
		let shiftX: number = 0;
		let shiftY: number = 0;

		addEventsListeners();

		function addEventsListeners(): void {
			// Mouse press event
			handElement.addEventListener('mousedown', event => {
				shiftX = event.clientX - handElement.getBoundingClientRect().left;
				shiftY = event.clientY - handElement.getBoundingClientRect().top;

				moveAt(event);
				document.addEventListener('mousemove', moveAt);
			});

			// Mouse unpressed event
			document.addEventListener('mouseup', () => {
				document.removeEventListener('mousemove', moveAt);
				dragElement.onmouseup = null;
			});

			dragElement.ondragstart = () => {
				return false;
			};

			// Window resize event
			window.addEventListener('resize', () => {
				let params = {
					width: dragElement.clientWidth,
					height: dragElement.clientHeight,
					top: dragElement.getBoundingClientRect().top,
					left: dragElement.getBoundingClientRect().left,
				};

				if (params.left + params.width > document.documentElement.clientWidth) {
					dragElement.style.left = Math.max(document.documentElement.clientWidth - params.width, 0) + 'px';
				}

				if (params.top + params.height > document.documentElement.clientHeight) {
					dragElement.style.top = Math.max(document.documentElement.clientHeight - params.height, 0) + 'px';
				}
			});
		}

		function moveAt(event: MouseEvent): void {
			let left = event.clientX - (shiftX);
			let top = event.clientY - (shiftY);

			if (left < 0) {
				left = 0;
			} else if (left > document.documentElement.clientWidth - dragElement.clientWidth) {
				left = document.documentElement.clientWidth - dragElement.clientWidth;
			}

			if (top < 0) {
				top = 0;
			} else if (top > document.documentElement.clientHeight - dragElement.clientHeight) {
				top = document.documentElement.clientHeight - dragElement.clientHeight;
			}

			dragElement.style.left = left + 'px';
			dragElement.style.top = top + 'px';
		}
	}

	initMessageListener();
}

export default SettingsPopup;
