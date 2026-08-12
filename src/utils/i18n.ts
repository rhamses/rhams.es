import { getRelativeLocaleUrl } from "astro:i18n";

/** BCP 47 tags used for dates and <html lang>. */
export const LOCALE_TAGS: Record<string, string> = {
	pt: "pt-BR",
	en: "en-US",
};

export function localeTag(locale: string | undefined): string {
	if (!locale) return LOCALE_TAGS.pt;
	return LOCALE_TAGS[locale] ?? locale;
}

/** Locale-aware path helper (respects prefix-other-locales). */
export function localePath(locale: string | undefined, path: string): string {
	return getRelativeLocaleUrl(locale ?? "pt", path);
}

export function formatDate(
	date: Date | null | undefined,
	locale: string | undefined,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	},
): string | null {
	if (!date) return null;
	return date.toLocaleDateString(localeTag(locale), options);
}
