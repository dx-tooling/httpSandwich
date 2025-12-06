import { describe, it, expect } from "vitest";
import { HttpStatusCategory, categorizeStatus } from "@/domain";

describe("categorizeStatus", () => {
  it("should return Unreachable for null", () => {
    expect(categorizeStatus(null)).toBe(HttpStatusCategory.Unreachable);
  });

  it("should return Informational for 1xx", () => {
    expect(categorizeStatus(100)).toBe(HttpStatusCategory.Informational);
    expect(categorizeStatus(101)).toBe(HttpStatusCategory.Informational);
    expect(categorizeStatus(199)).toBe(HttpStatusCategory.Informational);
  });

  it("should return Success for 2xx", () => {
    expect(categorizeStatus(200)).toBe(HttpStatusCategory.Success);
    expect(categorizeStatus(201)).toBe(HttpStatusCategory.Success);
    expect(categorizeStatus(204)).toBe(HttpStatusCategory.Success);
    expect(categorizeStatus(299)).toBe(HttpStatusCategory.Success);
  });

  it("should return Redirect for 3xx", () => {
    expect(categorizeStatus(300)).toBe(HttpStatusCategory.Redirect);
    expect(categorizeStatus(301)).toBe(HttpStatusCategory.Redirect);
    expect(categorizeStatus(302)).toBe(HttpStatusCategory.Redirect);
    expect(categorizeStatus(304)).toBe(HttpStatusCategory.Redirect);
    expect(categorizeStatus(399)).toBe(HttpStatusCategory.Redirect);
  });

  it("should return ClientError for 4xx", () => {
    expect(categorizeStatus(400)).toBe(HttpStatusCategory.ClientError);
    expect(categorizeStatus(401)).toBe(HttpStatusCategory.ClientError);
    expect(categorizeStatus(403)).toBe(HttpStatusCategory.ClientError);
    expect(categorizeStatus(404)).toBe(HttpStatusCategory.ClientError);
    expect(categorizeStatus(499)).toBe(HttpStatusCategory.ClientError);
  });

  it("should return ServerError for 5xx", () => {
    expect(categorizeStatus(500)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(501)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(502)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(503)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(599)).toBe(HttpStatusCategory.ServerError);
  });

  it("should return ServerError for unknown status codes", () => {
    expect(categorizeStatus(600)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(0)).toBe(HttpStatusCategory.ServerError);
    expect(categorizeStatus(99)).toBe(HttpStatusCategory.ServerError);
  });
});
