"""Abstract forge-adapter contract — Migration Plan v4.1 §E.12.

The control plane (agents, review pipelines, filers) MUST NOT talk to any
forge directly. It talks to a ``ForgeAdapter``. Swapping Gitea for GitHub
(or adding a second target forge) is a one-line change in the factory, not
a rewrite of every caller.

## What belongs on the adapter vs. the caller

On the adapter:
    Any operation whose wire shape, auth, or error semantics differs
    between forges. Issues, PRs, labels, review threads, merge, diff,
    check runs, webhook signature verification.

NOT on the adapter:
    Business rules (who's allowed to merge, what labels mean,
    state-machine transitions). Those live in the control plane and are
    forge-independent. The adapter is a thin, mechanical translator.

## Return types

Return dataclasses, not dicts. Two reasons: (a) static type checking
catches typos the dict-based code only finds at runtime; (b) adding a
field to a dataclass is a reviewable change, adding a key to a dict is
invisible until something breaks.

## Error policy

Every adapter method either returns a value or raises. Methods MUST
raise ``ForgeError`` (or a subclass) on remote failure. Callers should
never have to distinguish between ``None`` (legitimately missing) and a
transport failure.

Retryable vs. not:
    ``ForgeTransientError``  — network, 5xx, rate limit. Caller retries.
    ``ForgeAuthError``       — 401/403. Caller rotates credentials.
    ``ForgeNotFoundError``   — 404. Caller treats as missing.
    ``ForgeValidationError`` — 4xx for bad input (not auth). Caller fixes request.
    ``ForgeError``           — everything else.

## Idempotency

Where the underlying forge provides idempotency (e.g. Gitea's optional
``Idempotency-Key`` header), the adapter SHOULD forward the control
plane's idempotency key. Where it doesn't, the adapter SHOULD NOT fake
it — callers handle dedup at the control-plane layer (Work Queue
DO + KV, per §E.11).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Iterable, Optional


# ---------- exceptions ----------


class ForgeError(Exception):
    """Base for any forge-operation failure."""


class ForgeTransientError(ForgeError):
    """Retryable: network hiccup, 5xx, rate limit."""


class ForgeAuthError(ForgeError):
    """Non-retryable auth failure (401/403)."""


class ForgeNotFoundError(ForgeError):
    """Resource does not exist (404)."""


class ForgeValidationError(ForgeError):
    """Caller sent a bad request (4xx that isn't auth/not-found)."""


class ForgeCapabilityUnavailable(ForgeError):
    """The target forge does not expose the data this operation needs.

    Distinct from ForgeNotFoundError (404 for a specific resource) and
    ForgeError (generic failure). Callers that consume this must fail
    closed — the signal is genuinely absent, not "zero results returned".

    Example: Gitea v1 does not expose review-thread resolution state, so
    adapters/gitea.py raises this from list_review_threads(). The
    autonomous-merge gate catches it and blocks merge rather than treating
    an empty list as "no unresolved threads"."""


# ---------- return types ----------


@dataclass(frozen=True)
class Issue:
    """A forge Issue. Minimal shape; add fields as call-sites need them."""

    number: int
    title: str
    body: str
    state: str  # "open" | "closed"
    labels: tuple[str, ...]
    author: str
    created_at: datetime
    updated_at: datetime
    url: str


@dataclass(frozen=True)
class PullRequest:
    """A forge PR. ``base`` is the target branch, ``head`` is the source."""

    number: int
    title: str
    body: str
    state: str  # "open" | "closed" | "merged"
    base: str
    head: str
    author: str
    merged: bool
    mergeable: Optional[bool]  # None = forge has not yet computed
    draft: bool
    labels: tuple[str, ...]
    created_at: datetime
    updated_at: datetime
    url: str


@dataclass(frozen=True)
class ReviewThread:
    """A single review-comment thread on a PR. Resolution state matters
    for the autonomous-merge gate (per CLAUDE.md — unresolved threads
    block merge)."""

    id: str
    is_resolved: bool
    first_comment_body: str
    path: Optional[str]  # file path if inline, else None
    line: Optional[int]


@dataclass(frozen=True)
class CheckRun:
    """A CI check for a commit. Status + conclusion together reflect
    the check's lifecycle."""

    name: str
    status: str  # "queued" | "in_progress" | "completed"
    conclusion: Optional[str]  # "success" | "failure" | "neutral" | "cancelled" | "timed_out" | None (if not completed)
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    details_url: Optional[str]


@dataclass(frozen=True)
class Comment:
    """A comment on an Issue or PR."""

    id: int
    author: str
    body: str
    created_at: datetime
    url: str


# ---------- adapter contract ----------


class ForgeAdapter(ABC):
    """Contract every forge adapter implements. See module docstring."""

    # Informational -----------------------------------------------------

    @property
    @abstractmethod
    def forge_name(self) -> str:
        """Short identifier: ``"gitea"``, ``"github"``, etc. Used in logs."""

    @property
    @abstractmethod
    def repo_full_name(self) -> str:
        """``"<owner>/<repo>"`` for the repo this adapter talks to."""

    # Issues ------------------------------------------------------------

    @abstractmethod
    def create_issue(
        self,
        *,
        title: str,
        body: str,
        labels: Iterable[str] = (),
        assignees: Iterable[str] = (),
    ) -> Issue:
        """Open a new Issue. Returns the created Issue on success."""

    @abstractmethod
    def get_issue(self, number: int) -> Issue:
        """Fetch an Issue by number. Raises ``ForgeNotFoundError`` if absent."""

    @abstractmethod
    def list_issues(
        self,
        *,
        state: str = "open",  # "open" | "closed" | "all"
        labels: Iterable[str] = (),
        limit: int = 100,
    ) -> list[Issue]:
        """List Issues matching filters. ``limit`` is a hard cap — adapter
        MUST paginate internally to satisfy it, or raise if forge can't."""

    @abstractmethod
    def comment_on_issue(self, number: int, body: str) -> Comment:
        """Add a comment to an Issue. Returns the created Comment."""

    @abstractmethod
    def set_issue_labels(self, number: int, labels: Iterable[str]) -> None:
        """Replace the Issue's label set with exactly the given labels."""

    @abstractmethod
    def close_issue(self, number: int, *, reason: Optional[str] = None) -> None:
        """Close an Issue. ``reason`` is a forge-specific close reason
        (GitHub has ``completed``/``not_planned``; Gitea ignores it).
        Adapter maps to the forge's vocabulary or no-ops gracefully."""

    # Pull requests -----------------------------------------------------

    @abstractmethod
    def create_pull_request(
        self,
        *,
        title: str,
        body: str,
        head: str,
        base: str,
        draft: bool = False,
        labels: Iterable[str] = (),
    ) -> PullRequest:
        """Open a PR from ``head`` into ``base``."""

    @abstractmethod
    def get_pull_request(self, number: int) -> PullRequest:
        """Fetch a PR by number."""

    @abstractmethod
    def list_pull_requests(
        self,
        *,
        state: str = "open",
        base: Optional[str] = None,
        limit: int = 100,
    ) -> list[PullRequest]:
        """List PRs matching filters."""

    @abstractmethod
    def comment_on_pull_request(self, number: int, body: str) -> Comment:
        """Add an issue-comment to a PR (not an inline review comment)."""

    @abstractmethod
    def get_pull_request_diff(self, number: int) -> str:
        """Return the unified diff text for a PR. Used by Codex review
        and similar audit tooling."""

    @abstractmethod
    def list_review_threads(self, number: int) -> list[ReviewThread]:
        """Return all review threads on the PR with their resolution state.

        Required for the autonomous-merge gate: any unresolved thread
        blocks merge (see CLAUDE.md § Autonomous Merge Authority)."""

    @abstractmethod
    def list_check_runs(self, number: int) -> list[CheckRun]:
        """Return all CI check runs on the PR's head commit."""

    @abstractmethod
    def merge_pull_request(
        self,
        number: int,
        *,
        method: str = "merge",  # "merge" | "squash" | "rebase"
        commit_title: Optional[str] = None,
        commit_message: Optional[str] = None,
    ) -> PullRequest:
        """Merge a PR. Returns the updated PR (``state == "merged"``)."""

    # Webhooks ---------------------------------------------------------

    @abstractmethod
    def verify_webhook_signature(
        self,
        *,
        body: bytes,
        signature_header: str,
        secret: str,
    ) -> bool:
        """Verify an incoming webhook signature. Each forge has its own
        scheme (GitHub: ``X-Hub-Signature-256`` as ``sha256=<hex>``;
        Gitea: same). Adapter encapsulates the constant-time comparison
        so callers don't roll their own crypto."""


# ---------- factory ----------


def get_adapter(forge: str, **kwargs) -> ForgeAdapter:
    """Return an adapter instance for the named forge.

    Kept here (not in each adapter module) so callers have exactly one
    import line to change when the default forge flips. Concrete adapter
    imports are lazy — we don't pull in every SDK for one forge's use.

    GitHub was intentionally removed on 2026-04-21: the account has been
    archive-only since the 2026-04-19 suspension, and shipping a factory
    branch that imports a non-existent adapter would raise
    ModuleNotFoundError at call time instead of a clean unsupported-forge
    error. Re-add a github branch here alongside a real adapters/github.py
    only if GitHub becomes canonical again."""
    forge = forge.lower()
    if forge == "gitea":
        from .gitea import GiteaAdapter  # noqa: PLC0415 — intentional lazy import

        return GiteaAdapter(**kwargs)
    raise ValueError(f"unsupported forge: {forge!r} (only 'gitea' is available)")
