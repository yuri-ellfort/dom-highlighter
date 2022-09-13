export interface RequestMessage {
	action: 'doHighlight' | 'openSettingsPopup';
	data: any;
}

export type HighlightType = 'box-shadow' | 'border' | 'outline';

export interface HighlightParams {
	color: string,
	size: number,
	opacity: number,
	defaultMask: string,
	mask: string,
	useMask: boolean,
	type: HighlightType
}

export interface Highlight {
	tabId: number;
	active: boolean;
	settingsInjected: boolean;
	params: HighlightParams;
	messages: Record<string, string>
}
