import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { type ActivityEntry, ActivityPane } from "./activity-pane";

// BlockNote doesn't run in jsdom; the pane only needs something to mount.
vi.mock("@/components/shared/comment-blocknote", () => ({
	blocksToText: (blocks: Array<{ text?: string }>) =>
		blocks.map((b) => b.text ?? "").join("\n"),
	CommentDisplay: ({ blocks }: { blocks: Array<{ text?: string }> }) => (
		<p>{blocks.map((b) => b.text).join("\n")}</p>
	),
	CommentEditor: forwardRef(() => <div data-testid="comment-editor" />),
}));

function comment(id: string, text: string, createdAt: string): ActivityEntry {
	return {
		id,
		actor_id: "member-1",
		actor_name: "Ada",
		actor_username: "ada",
		activity_type: "comment",
		content: [{ text }],
		created_at: createdAt,
		updated_at: createdAt,
	};
}

const threeComments = [
	comment("1", "first comment", "2026-03-01T10:00:00Z"),
	comment("2", "second comment", "2026-03-02T10:00:00Z"),
	comment("3", "third comment", "2026-03-03T10:00:00Z"),
];

function renderPane(
	activities: ActivityEntry[],
	{ withComposer = true }: { withComposer?: boolean } = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<ActivityPane
				projectId="project-1"
				entityId="task-1"
				queryKey={["activities", "task-1"]}
				queryFn={async () => activities}
				addComment={withComposer ? async () => undefined : undefined}
				describeActivity={() => "changed something"}
				getCommentBlocks={(content) =>
					Array.isArray(content) ? content : null
				}
			/>
		</QueryClientProvider>,
	);
}

async function renderedCommentTexts() {
	await screen.findByText("first comment");
	return screen
		.getAllByText(/comment$/)
		.map((el) => el.textContent)
		.filter((text) => text?.endsWith(" comment"));
}

function isBefore(a: Element, b: Element) {
	return Boolean(
		a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
	);
}

describe("ActivityPane order", () => {
	it("shows the newest comment first by default, with the composer above the list", async () => {
		renderPane(threeComments);

		expect(await renderedCommentTexts()).toEqual([
			"third comment",
			"second comment",
			"first comment",
		]);
		expect(
			screen.getByRole("button", { name: "Sort order: Newest first" }),
		).toBeInTheDocument();
		expect(
			isBefore(
				screen.getByTestId("comment-editor"),
				screen.getByText("third comment"),
			),
		).toBe(true);
	});

	it("switches to oldest first, remembers the choice, and moves the composer below the list", async () => {
		const user = userEvent.setup();
		renderPane(threeComments);
		await screen.findByText("first comment");

		await user.click(
			screen.getByRole("button", { name: "Sort order: Newest first" }),
		);

		expect(await renderedCommentTexts()).toEqual([
			"first comment",
			"second comment",
			"third comment",
		]);
		expect(window.localStorage.getItem("paca:activity-order")).toBe("oldest");
		expect(
			screen.getByRole("button", { name: "Sort order: Oldest first" }),
		).toBeInTheDocument();
		expect(
			isBefore(
				screen.getByText("third comment"),
				screen.getByTestId("comment-editor"),
			),
		).toBe(true);
	});

	it("restores a stored oldest-first preference on mount", async () => {
		window.localStorage.setItem("paca:activity-order", "oldest");
		renderPane(threeComments);

		expect(await renderedCommentTexts()).toEqual([
			"first comment",
			"second comment",
			"third comment",
		]);
	});

	it("hides the order toggle when there is nothing to reorder", async () => {
		renderPane([threeComments[0]]);
		await screen.findByText("first comment");

		expect(
			screen.queryByRole("button", { name: /^Sort order/ }),
		).not.toBeInTheDocument();
	});

	it("renders no composer when comments are read-only", async () => {
		const { container } = renderPane(threeComments, { withComposer: false });
		await screen.findByText("first comment");

		expect(
			within(container).queryByTestId("comment-editor"),
		).not.toBeInTheDocument();
	});
});
