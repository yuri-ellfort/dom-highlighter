import { Highlight, HighlightParams, RequestMessage } from "./interfaces/background.interfaces";
import useContent from "./scripts/useContent";
import SettingsPopupStyles from './components/settings-popup/settings-popup.scss?inline';
import SettingsPopupHtml from './components/settings-popup/settings-popup.html?raw';
import SettingsPopupScript from './components/settings-popup/settings-popup';
import { defaultHighlightParams } from "./utils/constans";
import Messages from './_locales/en/messages.json';

class Background {
	private highlights: Record<number, Highlight> = [];

	constructor() {
		this.checkInitialState();
		this.initEventsListeners();
		Background.createContextMenu();
	}

	private initEventsListeners(): void {
		this.initIconClickHandler();
		this.initTabChangeHandler();
		this.initTabCloseHandler();
		this.initTabUpdateHandler();
		this.initContextMenuClickedHandler();
		this.initChangeParamsHandler();
	}

	private checkInitialState(): void {
		chrome.tabs.query({currentWindow: true, active: true}, async (tab) => {
			const tabId = tab[0].id;

			if (tabId && !await Background.checkActiveTabPermission()) {
				await chrome.action.disable(tabId);
			}
		});
	}

	private initIconClickHandler(): void {
		chrome.action.onClicked.addListener(async ({id: tabId}) => {
			if (!tabId) {
				return;
			}

			if (!this.highlights[tabId]) {
				await this.initHilightForTab(tabId);
			}

			this.highlights[tabId].active = !this.highlights[tabId].active;
			this.doHighlight(tabId);
		});
	}

	private async initHilightForTab(tabId: number): Promise<void> {
		this.highlights[tabId] = {
			tabId,
			active: false,
			settingsInjected: false,
			params: defaultHighlightParams,
			messages: {},
		};

		this.initMessages(tabId);
		await this.injectContent(tabId);
	}

	private initTabChangeHandler(): void {
		chrome.tabs.onActivated.addListener(async ({tabId}) => {
			if (!await Background.checkActiveTabPermission()) {
				await chrome.action.disable(tabId);
			}
		});
	}

	private initTabCloseHandler(): void {
		chrome.tabs.onRemoved.addListener(tabId => {
			if (this.highlights[tabId]) {
				delete this.highlights[tabId];
			}
		});
	}

	private initTabUpdateHandler(): void {
		chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
			if (changeInfo.status == 'complete') {
				if (!await Background.checkActiveTabPermission()) {
					await chrome.action.disable(tabId);
					return;
				}

				if (this.highlights[tabId]) {
					await this.injectContent(tabId);


					this.doHighlight(tabId);
				}
			}
		});
	}

	private initContextMenuClickedHandler(): void {
		chrome.contextMenus.onClicked.addListener(async (info, tab) => {
			if (tab?.id && info.menuItemId === 'settings') {
				await this.openSettingsPopup(tab.id);
			}
		});
	}

	private initChangeParamsHandler(): void {
		chrome.runtime.onMessage.addListener(message => {
			if (message.action === 'changeParams') {
				this.changeParams(message.data);
			}
		});
	}

	private changeParams(params: Partial<HighlightParams>): void {
		chrome.tabs.query({currentWindow: true, active: true}, tab => {
			const tabId = tab[0].id;

			if (tabId && this.highlights[tabId]) {
				Object.assign(this.highlights[tabId].params, params);
				this.doHighlight(tabId);
			}
		});
	}

	private initMessages(tabId: number): void {
		const params = this.highlights[tabId].params;

		Object.keys(params).forEach(paramName => {
			this.highlights[tabId].messages[paramName] = Background.getMessage(paramName);
		})
	}

	private async injectContent(tabId: number): Promise<void> {
		await chrome.scripting.executeScript({
			target: {tabId},
			func: useContent,
		});
	}

	private doHighlight(tabId: number): void {
		chrome.tabs.sendMessage<RequestMessage>(tabId, {
			action: 'doHighlight',
			data: this.highlights[tabId],
		});

		this.updateIcon(tabId)
	}

	private updateIcon(tabId: number): void {
		const active = !!this.highlights[tabId]?.active ?? false;
		const iconPath = `/images/icons/${active ? 'active-16.png' : 'default-16.png'}`;

		chrome.action.setIcon({path: iconPath});
	}

	private async openSettingsPopup(tabId: number): Promise<void> {

		if (!this.highlights[tabId]) {
			await this.initHilightForTab(tabId);
		}

		if (!this.highlights[tabId].settingsInjected) {
			await chrome.scripting.executeScript({
				target: {tabId},
				func: SettingsPopupScript,
			});

			await chrome.scripting.insertCSS({
				target: {tabId},
				css: SettingsPopupStyles,
			});

			this.highlights[tabId].settingsInjected = true;
		}

		chrome.tabs.sendMessage(tabId, {
			action: 'openSettingsPopup',
			data: {
				params: this.highlights[tabId].params,
				messages: this.highlights[tabId].messages,
				html: SettingsPopupHtml,
			}
		});
	}

	private static async checkActiveTabPermission(): Promise<boolean> {
		const tabs = await chrome.tabs.query({active: true, currentWindow: true});
		const tab = tabs[0]

		return !!tab?.url && ['http:', 'https:', 'file:'].includes(new URL(tab.url).protocol);
	}

	private static getMessage(name: string): string {
		if ('getMessage' in chrome.i18n) {
			return chrome.i18n.getMessage(name);
		}

		return Object(Messages)[name]?.message ?? '';
	}

	private static createContextMenu(): void {
		chrome.contextMenus.create({
			id: 'settings',
			title: Background.getMessage('settingsPopupTitle'),
			contexts: ['action']
		})
	}
}

chrome.runtime.onInstalled.addListener(() => {
	new Background();
});

