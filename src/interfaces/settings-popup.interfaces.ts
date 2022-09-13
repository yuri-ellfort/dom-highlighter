import { HighlightParams } from "./background.interfaces";

export interface SettingsPopupParams {
	params: HighlightParams;
	messages: Record<string, string>;
}

export interface SettingsFieldParam {
	name: string;
	value: string | number | boolean;
	title: string;
}

export interface SettingsAction {
	event: string;
	action: (data?: any) => void
}
