import { describe, expect, it } from "vitest";
import { parseActivityOrder, sortByCreatedAt } from "./activity-order";

const entries = [
	{ id: "b", created_at: "2026-03-02T10:00:00Z" },
	{ id: "a", created_at: "2026-03-01T10:00:00Z" },
	{ id: "c", created_at: "2026-03-03T10:00:00Z" },
];

describe("parseActivityOrder", () => {
	it("accepts the two known orders", () => {
		expect(parseActivityOrder("oldest")).toBe("oldest");
		expect(parseActivityOrder("newest")).toBe("newest");
	});

	it("falls back to newest first for missing or unknown values", () => {
		expect(parseActivityOrder(null)).toBe("newest");
		expect(parseActivityOrder("asc")).toBe("newest");
	});
});

describe("sortByCreatedAt", () => {
	it("sorts newest first", () => {
		expect(sortByCreatedAt(entries, "newest").map((e) => e.id)).toEqual([
			"c",
			"b",
			"a",
		]);
	});

	it("sorts oldest first", () => {
		expect(sortByCreatedAt(entries, "oldest").map((e) => e.id)).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	it("keeps input order for equal timestamps in both directions", () => {
		const tied = [
			{ id: "x", created_at: "2026-03-01T10:00:00Z" },
			{ id: "y", created_at: "2026-03-01T10:00:00Z" },
		];
		expect(sortByCreatedAt(tied, "newest").map((e) => e.id)).toEqual([
			"x",
			"y",
		]);
		expect(sortByCreatedAt(tied, "oldest").map((e) => e.id)).toEqual([
			"x",
			"y",
		]);
	});

	it("does not mutate its input", () => {
		const input = [...entries];
		sortByCreatedAt(input, "newest");
		expect(input).toEqual(entries);
	});
});
