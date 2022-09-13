import { HighlightParams } from './background.interfaces';

export interface OpenSettingsPopupActionParams {
	params: HighlightParams;
	messages: Record<string, string>
	html: string;
}
