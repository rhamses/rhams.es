/** KV key holding the last publish time for one locale. */
export function publishVersionKey(locale: string): string {
	return `content-publish-version:${locale}`;
}

export async function publishVersion(kv: KVNamespace, locale: string): Promise<string> {
	return (await kv.get(publishVersionKey(locale))) ?? "0";
}
