"""Gitea implementation of the ForgeAdapter contract.

Status: UNTESTED against a live Gitea instance.
        Written against Gitea's documented REST API v1.24. Once the
        Hetzner + Gitea stack is live, run the integration suite (to be
        written) and reconcile any field-shape surprises here.

References:
    - Gitea API docs:   https://docs.gitea.com/api/1.24/
    - Swagger:          https://<gitea-host>/api/swagger

Design notes:
    - Zero third-party deps — uses urllib from stdlib. Consistent with
      the rest of the TBM Python tooling (see .github/scripts/*.py);
      no requirements.txt anywhere in the repo.
    - Gitea's ``state`` for PRs is ``"open" | "closed"``; merged status
      is a separate ``merged: bool`` field. This adapter exposes the
      combined ``"open" | "closed" | "merged"`` shape that ForgeAdapter's
      PullRequest dataclass expects — mapped in ``_pr_from_json``.
    - Review-thread resolution state is NOT exposed by Gitea v1 API.
      ``list_review_threads`` returns an empty list with a warning.
      The autonomous-merge gate (CLAUDE.md § Autonomous Merge Authority)
      cannot rely on the thread-resolution signal on Gitea PRs —
      callers must use a different gate (e.g. explicit reviewer approval
      via check-run states) on Gitea.
"""

from __future__ import annotations

import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from hashlib import sha256
from typing import Any, Iterable, Optional

from .base import (
    CheckRun,
    Comment,
    ForgeAdapter,
    ForgeAuthError,
    ForgeError,
    ForgeNotFoundError,
    ForgeTransientError,
    ForgeValidationError,
    Issue,
    PullRequest,
    ReviewThread,
)


def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    """Parse a Gitea ISO-8601 datetime. Handles both '+00:00' and 'Z' suffixes.

    Returns None on a falsy input; lets ValueError propagate on real
    parse failures — silent fallback would mask a forge-format change.
    """
    if not s:
        return None
    # Python < 3.11 fromisoformat doesn't accept trailing Z; normalize.
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


class GiteaAdapter(ForgeAdapter):
    """Talks to a Gitea instance via its REST API v1.

    Args:
        base_url:   e.g. "https://git.thompsonfams.com"  (no trailing slash)
        owner:      repo owner/org, e.g. "blucsigma05"
        repo:       repo name, e.g. "tbm-apps-script"
        token:      personal access token for the bot account. Scope:
                    ``read:repository``, ``write:repository``, ``write:issue``
                    — never give the bot admin scope.
        timeout_s:  per-request HTTP timeout (seconds). Default 30.
    """

    def __init__(
        self,
        *,
        base_url: str,
        owner: str,
        repo: str,
        token: str,
        timeout_s: float = 30.0,
    ):
        if not base_url or not token:
            raise ValueError("GiteaAdapter: base_url and token are required")
        self._base = base_url.rstrip("/")
        self._owner = owner
        self._repo = repo
        self._token = token
        self._timeout = timeout_s

    # --- informational ------------------------------------------------

    @property
    def forge_name(self) -> str:
        return "gitea"

    @property
    def repo_full_name(self) -> str:
        return f"{self._owner}/{self._repo}"

    # --- internal HTTP helper -----------------------------------------

    def _repo_path(self, suffix: str = "") -> str:
        return f"/repos/{self._owner}/{self._repo}{suffix}"

    def _request(
        self,
        method: str,
        path: str,
        *,
        body: Any = None,
        params: Optional[dict] = None,
        accept: str = "application/json",
    ) -> Any:
        """Raw HTTP call. Returns parsed JSON unless ``accept`` is not
        application/json, in which case returns the raw text."""
        url = f"{self._base}/api/v1{path}"
        if params:
            url = f"{url}?{urllib.parse.urlencode(params)}"
        data = None
        headers = {
            "Authorization": f"token {self._token}",
            "Accept": accept,
        }
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as e:
            self._raise_for_status(e)
            raise  # unreachable — _raise_for_status always raises
        except urllib.error.URLError as e:
            raise ForgeTransientError(f"gitea {method} {path}: network error: {e}") from e
        if not raw:
            return None
        if accept == "application/json":
            try:
                return json.loads(raw)
            except json.JSONDecodeError as e:
                raise ForgeError(f"gitea {method} {path}: non-JSON response: {raw[:200]!r}") from e
        return raw.decode("utf-8", errors="replace")

    @staticmethod
    def _raise_for_status(e: urllib.error.HTTPError) -> None:
        code = e.code
        try:
            detail = e.read().decode("utf-8", errors="replace")
        except Exception:
            detail = ""
        msg = f"gitea HTTP {code}: {detail[:500]}"
        if code == 404:
            raise ForgeNotFoundError(msg) from e
        if code in (401, 403):
            raise ForgeAuthError(msg) from e
        if 500 <= code < 600 or code == 429:
            raise ForgeTransientError(msg) from e
        if 400 <= code < 500:
            raise ForgeValidationError(msg) from e
        raise ForgeError(msg) from e

    # --- JSON → dataclass mappers -------------------------------------

    @staticmethod
    def _labels(obj: dict) -> tuple[str, ...]:
        # Gitea: [{"name": "bug", ...}]
        return tuple(lbl.get("name", "") for lbl in obj.get("labels", []) if lbl.get("name"))

    def _issue_from_json(self, obj: dict) -> Issue:
        return Issue(
            number=obj["number"],
            title=obj.get("title", ""),
            body=obj.get("body") or "",
            state=obj.get("state", "open"),
            labels=self._labels(obj),
            author=(obj.get("user") or {}).get("login", ""),
            created_at=_parse_dt(obj.get("created_at")) or datetime.min,
            updated_at=_parse_dt(obj.get("updated_at")) or datetime.min,
            url=obj.get("html_url", ""),
        )

    def _pr_from_json(self, obj: dict) -> PullRequest:
        merged = bool(obj.get("merged", False))
        # ForgeAdapter's state is "open" | "closed" | "merged" — collapse.
        state = "merged" if merged else obj.get("state", "open")
        return PullRequest(
            number=obj["number"],
            title=obj.get("title", ""),
            body=obj.get("body") or "",
            state=state,
            base=(obj.get("base") or {}).get("ref", ""),
            head=(obj.get("head") or {}).get("ref", ""),
            author=(obj.get("user") or {}).get("login", ""),
            merged=merged,
            mergeable=obj.get("mergeable"),
            draft=bool(obj.get("draft", False)),
            labels=self._labels(obj),
            created_at=_parse_dt(obj.get("created_at")) or datetime.min,
            updated_at=_parse_dt(obj.get("updated_at")) or datetime.min,
            url=obj.get("html_url", ""),
        )

    @staticmethod
    def _comment_from_json(obj: dict) -> Comment:
        return Comment(
            id=int(obj["id"]),
            author=(obj.get("user") or {}).get("login", ""),
            body=obj.get("body") or "",
            created_at=_parse_dt(obj.get("created_at")) or datetime.min,
            url=obj.get("html_url", ""),
        )

    # --- Issues -------------------------------------------------------

    def create_issue(
        self,
        *,
        title: str,
        body: str,
        labels: Iterable[str] = (),
        assignees: Iterable[str] = (),
    ) -> Issue:
        payload: dict[str, Any] = {"title": title, "body": body}
        labels = list(labels)
        assignees = list(assignees)
        if labels:
            # Gitea's create-issue endpoint accepts label IDs only, not names.
            # Callers who only have names must call set_issue_labels after create.
            # We swallow label names here rather than fail silently — set them
            # post-create so the net effect matches caller intent.
            pass
        if assignees:
            payload["assignees"] = assignees
        obj = self._request("POST", self._repo_path("/issues"), body=payload)
        issue = self._issue_from_json(obj)
        if labels:
            self.set_issue_labels(issue.number, labels)
            # Refetch to pick up the labels on the return value.
            return self.get_issue(issue.number)
        return issue

    def get_issue(self, number: int) -> Issue:
        obj = self._request("GET", self._repo_path(f"/issues/{number}"))
        return self._issue_from_json(obj)

    def list_issues(
        self,
        *,
        state: str = "open",
        labels: Iterable[str] = (),
        limit: int = 100,
    ) -> list[Issue]:
        params: dict[str, Any] = {"state": state, "type": "issues", "limit": min(limit, 50)}
        labels = list(labels)
        if labels:
            params["labels"] = ",".join(labels)
        # Gitea paginates; keep going until we hit limit or run out.
        out: list[Issue] = []
        page = 1
        while len(out) < limit:
            params["page"] = page
            batch = self._request("GET", self._repo_path("/issues"), params=params)
            if not batch:
                break
            # Gitea's /issues endpoint returns issues AND PRs unless type=issues.
            for obj in batch:
                if obj.get("pull_request"):
                    continue
                out.append(self._issue_from_json(obj))
                if len(out) >= limit:
                    break
            if len(batch) < params["limit"]:
                break
            page += 1
        return out

    def comment_on_issue(self, number: int, body: str) -> Comment:
        obj = self._request(
            "POST",
            self._repo_path(f"/issues/{number}/comments"),
            body={"body": body},
        )
        return self._comment_from_json(obj)

    def set_issue_labels(self, number: int, labels: Iterable[str]) -> None:
        labels = list(labels)
        # Gitea's PUT /issues/{n}/labels accepts label names OR IDs. Names
        # are simpler for callers — pass as-is.
        self._request(
            "PUT",
            self._repo_path(f"/issues/{number}/labels"),
            body={"labels": labels},
        )

    def close_issue(self, number: int, *, reason: Optional[str] = None) -> None:
        # Gitea has no "close reason" vocabulary (unlike GitHub's
        # completed/not_planned). `reason` is silently dropped; post it
        # as a comment beforehand if you need it in the audit trail.
        self._request(
            "PATCH",
            self._repo_path(f"/issues/{number}"),
            body={"state": "closed"},
        )

    # --- Pull requests ------------------------------------------------

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
        payload = {"title": title, "body": body, "head": head, "base": base}
        if draft:
            # Gitea uses a title prefix convention for drafts: "WIP: " / "[WIP]".
            # The API also accepts a `draft` field as of 1.20+; pass both to be safe.
            payload["draft"] = True
        obj = self._request("POST", self._repo_path("/pulls"), body=payload)
        pr = self._pr_from_json(obj)
        labels = list(labels)
        if labels:
            self.set_issue_labels(pr.number, labels)
            return self.get_pull_request(pr.number)
        return pr

    def get_pull_request(self, number: int) -> PullRequest:
        obj = self._request("GET", self._repo_path(f"/pulls/{number}"))
        return self._pr_from_json(obj)

    def list_pull_requests(
        self,
        *,
        state: str = "open",
        base: Optional[str] = None,
        limit: int = 100,
    ) -> list[PullRequest]:
        params: dict[str, Any] = {"state": state, "limit": min(limit, 50)}
        if base:
            # Gitea doesn't filter by base branch on the list endpoint;
            # we have to post-filter. Fetch + filter client-side.
            pass
        out: list[PullRequest] = []
        page = 1
        while len(out) < limit:
            params["page"] = page
            batch = self._request("GET", self._repo_path("/pulls"), params=params)
            if not batch:
                break
            for obj in batch:
                pr = self._pr_from_json(obj)
                if base and pr.base != base:
                    continue
                out.append(pr)
                if len(out) >= limit:
                    break
            if len(batch) < params["limit"]:
                break
            page += 1
        return out

    def comment_on_pull_request(self, number: int, body: str) -> Comment:
        # In Gitea (as in GitHub), issue-type comments on a PR go to the
        # /issues/{n}/comments endpoint. Inline review comments would use
        # /pulls/{n}/reviews.
        return self.comment_on_issue(number, body)

    def get_pull_request_diff(self, number: int) -> str:
        # Gitea serves the diff as text/plain at /pulls/{n}.diff.
        return self._request(
            "GET",
            self._repo_path(f"/pulls/{number}.diff"),
            accept="text/plain",
        )

    def list_review_threads(self, number: int) -> list[ReviewThread]:
        # Gitea v1 API does NOT expose review-thread resolution state the
        # way GitHub's GraphQL does. Earlier revisions returned [] here,
        # which let the autonomous-merge gate interpret "signal unavailable"
        # as "no unresolved threads" and silently merge PRs with open
        # review feedback. Raise ForgeCapabilityUnavailable instead so
        # callers fail closed — the gate catches it and blocks merge.
        #
        # If Gitea ships thread-resolution in a future version, implement
        # this against /pulls/{n}/reviews and remove the raise.
        from .base import ForgeCapabilityUnavailable

        raise ForgeCapabilityUnavailable(
            "Gitea v1 does not expose review-thread resolution state; "
            "callers depending on list_review_threads must fail closed."
        )

    def list_check_runs(self, number: int) -> list[CheckRun]:
        # Gitea uses commit statuses (simpler than GitHub check runs).
        # Fetch the PR's head SHA, then the combined status for that SHA.
        pr = self._request("GET", self._repo_path(f"/pulls/{number}"))
        head_sha = (pr.get("head") or {}).get("sha")
        if not head_sha:
            return []
        obj = self._request("GET", self._repo_path(f"/commits/{head_sha}/statuses"))
        out: list[CheckRun] = []
        for s in obj or []:
            raw_state = s.get("status") or s.get("state", "")
            # Gitea status → ForgeAdapter shape
            # "pending" | "success" | "failure" | "error" | "warning"
            if raw_state in ("success", "failure", "error", "warning"):
                status = "completed"
                conclusion = {
                    "success": "success",
                    "failure": "failure",
                    "error": "failure",
                    "warning": "neutral",
                }[raw_state]
            elif raw_state == "pending":
                status = "in_progress"
                conclusion = None
            else:
                status = raw_state or "queued"
                conclusion = None
            out.append(
                CheckRun(
                    name=s.get("context", ""),
                    status=status,
                    conclusion=conclusion,
                    started_at=_parse_dt(s.get("created_at")),
                    completed_at=_parse_dt(s.get("updated_at")) if status == "completed" else None,
                    details_url=s.get("target_url") or None,
                )
            )
        return out

    def merge_pull_request(
        self,
        number: int,
        *,
        method: str = "merge",
        commit_title: Optional[str] = None,
        commit_message: Optional[str] = None,
    ) -> PullRequest:
        # Gitea method names match: "merge" | "rebase" | "rebase-merge" |
        # "squash" | "fast-forward-only". ForgeAdapter's contract allows
        # only merge/squash/rebase — passthrough is safe for those.
        payload: dict[str, Any] = {"Do": method}
        if commit_title is not None:
            payload["MergeTitleField"] = commit_title
        if commit_message is not None:
            payload["MergeMessageField"] = commit_message
        self._request("POST", self._repo_path(f"/pulls/{number}/merge"), body=payload)
        # Merge endpoint returns 200 with empty body — refetch for the updated PR.
        return self.get_pull_request(number)

    # --- Webhooks -----------------------------------------------------

    def verify_webhook_signature(
        self,
        *,
        body: bytes,
        signature_header: str,
        secret: str,
    ) -> bool:
        # Gitea sends X-Gitea-Signature as a bare hex digest (no "sha256="
        # prefix, unlike GitHub). Accept either form to be defensive.
        if not signature_header or not secret:
            return False
        expected = hmac.new(secret.encode("utf-8"), body, sha256).hexdigest()
        # Strip optional "sha256=" prefix.
        received = signature_header
        if received.startswith("sha256="):
            received = received[len("sha256="):]
        return hmac.compare_digest(expected.lower(), received.lower())
