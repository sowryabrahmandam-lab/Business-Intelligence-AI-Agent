import os
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
import requests

logger = logging.getLogger(__name__)

MONDAY_API_URL = "https://api.monday.com/v2"
API_VERSION = "2024-01"

class MondayAPIError(Exception):
    """Custom exception for Monday.com API failures."""
    pass

class MondayClient:
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv("MONDAY_API_TOKEN", "")
        self.headers = {
            "Authorization": self.api_token,
            "Content-Type": "application/json",
            "API-Version": API_VERSION
        }

    def _execute_query(self, query: str, variables: Optional[Dict[str, Any]] = None, retries: int = 3, backoff: float = 1.0) -> Dict[str, Any]:
        """Executes a GraphQL query with retries and rate-limit handling."""
        if not self.api_token:
            raise MondayAPIError("MONDAY_API_TOKEN is missing or empty. Please set it in backend/.env or environment.")

        for attempt in range(retries):
            try:
                response = requests.post(
                    MONDAY_API_URL,
                    json={"query": query, "variables": variables or {}},
                    headers=self.headers,
                    timeout=30
                )

                if response.status_code == 429:
                    wait_time = backoff * (2 ** attempt)
                    logger.warning(f"Rate limited by monday.com. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                if response.status_code >= 500:
                    wait_time = backoff * (2 ** attempt)
                    logger.warning(f"Monday.com 5xx error ({response.status_code}). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    raise MondayAPIError(f"HTTP {response.status_code}: {response.text}")

                data = response.json()
                if "errors" in data and data["errors"]:
                    err_msg = "; ".join([e.get("message", str(e)) for e in data["errors"]])
                    raise MondayAPIError(f"GraphQL Error: {err_msg}")

                return data.get("data", {})

            except requests.RequestException as e:
                if attempt == retries - 1:
                    raise MondayAPIError(f"Network error communicating with monday.com: {str(e)}")
                time.sleep(backoff * (2 ** attempt))

        raise MondayAPIError("Failed to execute monday.com query after retries.")

    def test_connection(self, board_id: str) -> Dict[str, Any]:
        """Tests connection to a specific board and returns metadata and row count."""
        if not board_id:
            return {
                "connected": False,
                "board_id": board_id,
                "error": "Board ID not provided",
                "item_count": 0,
                "columns": []
            }

        try:
            board_data, items = self.get_board_data(board_id)
            return {
                "connected": True,
                "board_id": board_id,
                "board_name": board_data.get("name", "Unknown"),
                "item_count": len(items),
                "columns": [c.get("title") for c in board_data.get("columns", [])]
            }
        except Exception as e:
            return {
                "connected": False,
                "board_id": board_id,
                "error": str(e),
                "item_count": 0,
                "columns": []
            }

    def get_board_columns(self, board_id: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Retrieves board metadata and a mapping of column_id -> column_title.
        """
        query = """
        query ($boardIds: [ID!]) {
            boards (ids: $boardIds) {
                id
                name
                description
                columns {
                    id
                    title
                    type
                    settings_str
                }
            }
        }
        """
        data = self._execute_query(query, {"boardIds": [str(board_id)]})
        boards = data.get("boards", [])
        if not boards:
            raise MondayAPIError(f"Board with ID {board_id} not found or inaccessible.")

        board = boards[0]
        col_map = {col["id"]: col["title"] for col in board.get("columns", [])}
        return board, col_map

    def get_board_data(self, board_id: str, limit_per_page: int = 100) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Retrieves all items from a board with dynamic column mapping and pagination.
        Supports cursor-based items_page (2023-10+) and falls back if needed.
        """
        board_meta, col_map = self.get_board_columns(board_id)
        all_items: List[Dict[str, Any]] = []

        # Try cursor-based pagination first
        try:
            initial_query = """
            query ($boardIds: [ID!], $limit: Int!) {
                boards (ids: $boardIds) {
                    items_page (limit: $limit) {
                        cursor
                        items {
                            id
                            name
                            column_values {
                                id
                                text
                                value
                                type
                            }
                        }
                    }
                }
            }
            """
            data = self._execute_query(initial_query, {"boardIds": [str(board_id)], "limit": limit_per_page})
            boards = data.get("boards", [])
            if boards and "items_page" in boards[0]:
                items_page = boards[0]["items_page"]
                raw_items = items_page.get("items", [])
                cursor = items_page.get("cursor")

                all_items.extend(self._normalize_items(raw_items, col_map))

                # Fetch subsequent pages using next_items_page
                next_query = """
                query ($cursor: String!, $limit: Int!) {
                    next_items_page (cursor: $cursor, limit: $limit) {
                        cursor
                        items {
                            id
                            name
                            column_values {
                                id
                                text
                                value
                                type
                            }
                        }
                    }
                }
                """
                while cursor:
                    next_data = self._execute_query(next_query, {"cursor": cursor, "limit": limit_per_page})
                    next_page = next_data.get("next_items_page", {})
                    cursor = next_page.get("cursor")
                    page_items = next_page.get("items", [])
                    if not page_items:
                        break
                    all_items.extend(self._normalize_items(page_items, col_map))

                return board_meta, all_items
        except Exception as e:
            logger.warning(f"Cursor-based pagination failed ({e}), trying legacy items query...")

        # Fallback legacy pagination
        page = 1
        legacy_query = """
        query ($boardIds: [ID!], $page: Int!, $limit: Int!) {
            boards (ids: $boardIds) {
                items (page: $page, limit: $limit) {
                    id
                    name
                    column_values {
                        id
                        text
                        value
                        type
                    }
                }
            }
        }
        """
        while True:
            data = self._execute_query(legacy_query, {"boardIds": [str(board_id)], "page": page, "limit": limit_per_page})
            boards = data.get("boards", [])
            if not boards:
                break
            raw_items = boards[0].get("items", [])
            if not raw_items:
                break
            all_items.extend(self._normalize_items(raw_items, col_map))
            if len(raw_items) < limit_per_page:
                break
            page += 1

        return board_meta, all_items

    def _normalize_items(self, raw_items: List[Dict[str, Any]], col_map: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Translates raw monday.com item objects into dictionary records keyed by column titles.
        Extracts clean text or parses JSON values when text is empty/uninformative.
        """
        normalized_records = []
        for item in raw_items:
            record: Dict[str, Any] = {
                "_item_id": item.get("id"),
                "Name": item.get("name")
            }
            
            for cv in item.get("column_values", []):
                col_id = cv.get("id")
                col_title = col_map.get(col_id, col_id)
                col_text = cv.get("text")
                col_val = cv.get("value")
                col_type = cv.get("type")

                # If text is available, prefer text
                if col_text is not None and col_text != "":
                    record[col_title] = col_text
                elif col_val is not None:
                    # Parse json value if possible
                    try:
                        parsed = json.loads(col_val)
                        if isinstance(parsed, dict):
                            # e.g. status: {"index": 1, "post_id": null}, numbers: "123", date: {"date": "2024-01-01"}
                            if "date" in parsed:
                                record[col_title] = parsed["date"]
                            elif "number" in parsed:
                                record[col_title] = parsed["number"]
                            elif "text" in parsed:
                                record[col_title] = parsed["text"]
                            else:
                                record[col_title] = str(parsed)
                        else:
                            record[col_title] = str(parsed)
                    except Exception:
                        record[col_title] = str(col_val)
                else:
                    record[col_title] = None

            # If 'Deal Name' or 'Deal name masked' is in columns, ensure Name is populated
            if "Deal Name" not in record and "Name" in record:
                record["Deal Name"] = record["Name"]
            if "Deal name masked" not in record and "Name" in record:
                record["Deal name masked"] = record["Name"]

            normalized_records.append(record)

        return normalized_records
