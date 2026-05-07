import { Snippet } from "../snippets/snippets";
import { Environment } from "../snippets/environment";
import { DEFAULT_SNIPPETS } from "src/utils/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/utils/default_snippet_variables";
import { DEFAULT_CONCEAL_MAP_JSON } from "../editor_extensions/conceal_maps";

export type snippetDebugLevel = "off" | "info" | "verbose";

type CMKeyMap = string;
type VimKeyMap = string;

interface LatexSuiteBasicSettings {
	snippetsEnabled: boolean;
	suppressSnippetTriggerOnIME: boolean;
	suppressIMEWarning: boolean;
	removeSnippetWhitespace: boolean;
	autoDelete$: boolean;
	loadSnippetsFromFile: boolean;
	loadSnippetVariablesFromFile: boolean;
	snippetsFileLocation: string;
	snippetVariablesFileLocation: string;
	autofractionEnabled: boolean;
	concealEnabled: boolean;
	concealRevealTimeout: number;
	colorPairedBracketsEnabled: boolean;
	highlightCursorBracketsEnabled: boolean;
	mathPreviewEnabled: boolean;
	mathPreviewPositionIsAbove: boolean;
	mathPreviewCursor: string;
	mathPreviewBracketHighlighting: boolean;
	autofractionSymbol: string;
	autofractionBreakingChars: string;
	matrixShortcutsEnabled: boolean;
	taboutEnabled: boolean;
	autoEnlargeBrackets: boolean;
	wordDelimiters: string;
	snippetDebug: snippetDebugLevel;
	vimEnabled: boolean;
	vimSelectMode: VimKeyMap;
	vimVisualMode: VimKeyMap;
	vimMatrixEnter: VimKeyMap;
	snippetRecursion: number;
	snippetIMEVersion: boolean;

}

/** triggers following the same format as https://codemirror.net/docs/ref/#view.KeyBinding */
export interface LatexSuiteCMKeymapSettings {
	snippetsTrigger: CMKeyMap;
	snippetNextTabstopTrigger: CMKeyMap;
	snippetPreviousTabstopTrigger: CMKeyMap;
	taboutTrigger: CMKeyMap;
}

/**
 * Settings that require further processing (e.g. conversion to an array) before being used.
 */
interface LatexSuiteRawSettings {
	autofractionExcludedEnvs: string;
	matrixShortcutsEnvNames: string;
	taboutClosingSymbols: string;
	autoEnlargeBracketsTriggers: string;
	forceMathLanguages: string;
	customConcealMap: string;
}

interface LatexSuiteParsedSettings {
	autofractionExcludedEnvs: Environment[];
	matrixShortcutsEnvNames: string[];
	taboutClosingSymbols: Set<string>;
	autoEnlargeBracketsTriggers: string[];
	forceMathLanguages: string[];
	customConcealMap: Record<string, string>;
}

export type LatexSuitePluginSettings = {snippets: string, snippetVariables: string} & LatexSuiteBasicSettings & LatexSuiteRawSettings & LatexSuiteCMKeymapSettings;
export type LatexSuiteCMSettings = {snippets: Snippet[]} & LatexSuiteBasicSettings & LatexSuiteParsedSettings & LatexSuiteCMKeymapSettings;

export const DEFAULT_SETTINGS: LatexSuitePluginSettings = {
	snippets: DEFAULT_SNIPPETS,
	snippetVariables: DEFAULT_SNIPPET_VARIABLES,

	// Basic settings
	snippetsEnabled: true,
	snippetsTrigger: "Tab",
	snippetNextTabstopTrigger: "Tab",
	snippetPreviousTabstopTrigger: "Shift-Tab",
	suppressSnippetTriggerOnIME: true,
	suppressIMEWarning: false,
	removeSnippetWhitespace: true,
	autoDelete$: true,
	loadSnippetsFromFile: false,
	loadSnippetVariablesFromFile: false,
	snippetsFileLocation: "",
	snippetVariablesFileLocation: "",
	concealEnabled: false,
	concealRevealTimeout: 0,
	colorPairedBracketsEnabled: true,
	highlightCursorBracketsEnabled: true,
	mathPreviewEnabled: true,
	mathPreviewPositionIsAbove: true,
	mathPreviewCursor: "▶",
	mathPreviewBracketHighlighting: false,
	autofractionEnabled: true,
	autofractionSymbol: "\\frac",
	autofractionBreakingChars: "+-=\t",
	matrixShortcutsEnabled: true,
	taboutEnabled: true,
	taboutTrigger: "Tab",
	autoEnlargeBrackets: true,
	wordDelimiters: "., +-\\n\t:;!?\\/{}[]()=~$'\"|`<>*^%#@&",

	// Raw settings
	autofractionExcludedEnvs:
	`[
		["^{", "}"],
		["\\\\pu{", "}"]
	]`,
	matrixShortcutsEnvNames: "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
	taboutClosingSymbols: "), ], \\rbrack, \\}, \\rbrace, \\rangle, \\rvert, \\rVert, \\rfloor, \\rceil, \\urcorner, }",
	autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",
	forceMathLanguages: "math",
	customConcealMap: DEFAULT_CONCEAL_MAP_JSON,
	snippetDebug: "off",
	vimEnabled: false,
	vimSelectMode: "<C-g>",
	vimVisualMode: "<C-g>",
	vimMatrixEnter: "o",
	snippetRecursion: 0,
	snippetIMEVersion: false,
}

export function processLatexSuiteSettings(snippets: Snippet[], settings: LatexSuitePluginSettings):LatexSuiteCMSettings {

	function strToArray(str: string) {
		return str.replace(/\s/g,"").split(",");
	}

	function getCustomConcealMap(mapStr: string): Record<string, string> {
		try {
			const parsed = JSON.parse(mapStr);
			if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
				return {};
			}
			return Object.fromEntries(
				Object.entries(parsed).filter(([, v]) => typeof v === "string")
			) as Record<string, string>;
		} catch {
			return {};
		}
	}

	function getAutofractionExcludedEnvs(envsStr: string) {
		let envs = [];

		try {
			const envsJSON = JSON.parse(envsStr);
			envs = envsJSON.map(function(env: string[]) {
				return {openSymbol: env[0], closeSymbol: env[1]};
			});
		}
		catch (e) {
			console.error(e);
		}

		return envs;
	}

	return {
		...settings,

		// Override raw settings with parsed settings
		snippets: snippets,
		autofractionExcludedEnvs: getAutofractionExcludedEnvs(settings.autofractionExcludedEnvs),
		matrixShortcutsEnvNames: strToArray(settings.matrixShortcutsEnvNames),
		taboutClosingSymbols: new Set<string>(strToArray(settings.taboutClosingSymbols)),
		// Add backslash to triggers that are LaTeX commands
		autoEnlargeBracketsTriggers: strToArray(settings.autoEnlargeBracketsTriggers)
			.map(trigger => /[A-Za-z]+/.test(trigger) ? `\\${trigger}` : trigger),
		forceMathLanguages: strToArray(settings.forceMathLanguages),
		customConcealMap: getCustomConcealMap(settings.customConcealMap),
	}
}
