export type ActivityOrder = "newest" | "oldest";

export const DEFAULT_ACTIVITY_ORDER: ActivityOrder = "newest";

export function parseActivityOrder(value: string | null): ActivityOrder {
	return value === "oldest" || value === "newest"
		? value
		: DEFAULT_ACTIVITY_ORDER;
}

/** Returns a new array sorted by `created_at`; entries with equal timestamps keep their input order. */
export function sortByCreatedAt<T extends { created_at: string }>(
	entries: readonly T[],
	order: ActivityOrder,
): T[] {
	const direction = order === "newest" ? -1 : 1;
	return entries
		.map((entry, index) => ({
			entry,
			index,
			time: Date.parse(entry.created_at),
		}))
		.sort((a, b) => (a.time - b.time) * direction || a.index - b.index)
		.map(({ entry }) => entry);
}
