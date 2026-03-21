import { describe, expect, it } from "vitest";
import {
  isActiveTicketStatus,
  isOpenTicketStatus,
  isResolvedTicketStatus,
  isWorkflowTicketStatus,
  normalizeTicketStatus,
} from "./ticketStatusGroups";

describe("ticketStatusGroups", () => {
  it("normalizes status safely", () => {
    expect(normalizeTicketStatus("in_progress")).toBe("IN_PROGRESS");
    expect(normalizeTicketStatus(undefined)).toBe("");
  });

  it("classifies active statuses used by dashboard cards", () => {
    expect(isActiveTicketStatus("OPEN")).toBe(true);
    expect(isActiveTicketStatus("IN_PROGRESS")).toBe(true);
    expect(isActiveTicketStatus("IN_REVIEW")).toBe(true);
    expect(isActiveTicketStatus("PENDING")).toBe(true);
    expect(isActiveTicketStatus("APPROVED")).toBe(true);
    expect(isActiveTicketStatus("RESOLVED")).toBe(false);
  });

  it("classifies open statuses", () => {
    expect(isOpenTicketStatus("OPEN")).toBe(true);
    expect(isOpenTicketStatus("pending")).toBe(true);
    expect(isOpenTicketStatus("APPROVED")).toBe(true);
    expect(isOpenTicketStatus("IN_PROGRESS")).toBe(false);
  });

  it("classifies workflow statuses", () => {
    expect(isWorkflowTicketStatus("IN_PROGRESS")).toBe(true);
    expect(isWorkflowTicketStatus("IN_REVIEW")).toBe(true);
    expect(isWorkflowTicketStatus("OPEN")).toBe(false);
  });

  it("classifies resolved statuses", () => {
    expect(isResolvedTicketStatus("RESOLVED")).toBe(true);
    expect(isResolvedTicketStatus("CLOSED")).toBe(true);
    expect(isResolvedTicketStatus("REJECTED")).toBe(true);
    expect(isResolvedTicketStatus("COMPLETED")).toBe(true);
    expect(isResolvedTicketStatus("IN_PROGRESS")).toBe(false);
  });
});
