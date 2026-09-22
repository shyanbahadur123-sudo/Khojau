import type { RequestStatus } from "@/types/database";

export type { RequestStatus };

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const REQUEST_NEXT_ACTIONS: Record<RequestStatus, { label: string; to: RequestStatus }[]> = {
  open: [
    { label: "Start progress", to: "in_progress" },
    { label: "Cancel", to: "cancelled" },
  ],
  in_progress: [
    { label: "Mark completed", to: "completed" },
    { label: "Cancel", to: "cancelled" },
  ],
  completed: [],
  cancelled: [],
};

export function formatRequestStatus(status: RequestStatus): string {
  return REQUEST_STATUS_LABEL[status] ?? status;
}
