import { describe, it, expect, vi } from "vitest";
import { ExchangeHistory } from "@/application";
import { type HttpExchange } from "@/domain";

describe("ExchangeHistory", () => {
  function createMockExchange(id: string): HttpExchange {
    return {
      id,
      timestamp: new Date(),
      request: {
        method: "GET",
        path: "/test",
        headers: {},
        body: null,
      },
      response: {
        statusCode: 200,
        headers: {},
        body: null,
      },
      durationMs: 10,
    };
  }

  describe("add and getAll", () => {
    it("should add exchanges", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));

      const all = history.getAll();
      expect(all).toHaveLength(2);
      expect(all[0]?.id).toBe("1");
      expect(all[1]?.id).toBe("2");
    });

    it("should maintain chronological order", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("a"));
      history.add(createMockExchange("b"));
      history.add(createMockExchange("c"));

      const all = history.getAll();
      expect(all.map((e) => e.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("max size", () => {
    it("should respect max size", () => {
      const history = new ExchangeHistory(3);

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));
      history.add(createMockExchange("3"));
      history.add(createMockExchange("4"));

      expect(history.size()).toBe(3);
    });

    it("should evict oldest when at capacity", () => {
      const history = new ExchangeHistory(3);

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));
      history.add(createMockExchange("3"));
      history.add(createMockExchange("4"));

      const all = history.getAll();
      expect(all.map((e) => e.id)).toEqual(["2", "3", "4"]);
    });
  });

  describe("getRecent", () => {
    it("should return most recent N exchanges", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));
      history.add(createMockExchange("3"));
      history.add(createMockExchange("4"));

      const recent = history.getRecent(2);
      expect(recent.map((e) => e.id)).toEqual(["3", "4"]);
    });

    it("should return all if count exceeds size", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));

      const recent = history.getRecent(10);
      expect(recent).toHaveLength(2);
    });
  });

  describe("size and capacity", () => {
    it("should report size correctly", () => {
      const history = new ExchangeHistory();

      expect(history.size()).toBe(0);

      history.add(createMockExchange("1"));
      expect(history.size()).toBe(1);

      history.add(createMockExchange("2"));
      expect(history.size()).toBe(2);
    });

    it("should report capacity correctly", () => {
      const history = new ExchangeHistory(50);
      expect(history.capacity()).toBe(50);
    });

    it("should use default capacity of 100", () => {
      const history = new ExchangeHistory();
      expect(history.capacity()).toBe(100);
    });
  });

  describe("onExchangeAdded", () => {
    it("should call handler when exchange is added", () => {
      const history = new ExchangeHistory();
      const handler = vi.fn();

      history.onExchangeAdded(handler);

      const exchange = createMockExchange("1");
      history.add(exchange);

      expect(handler).toHaveBeenCalledWith(exchange);
    });

    it("should call multiple handlers", () => {
      const history = new ExchangeHistory();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      history.onExchangeAdded(handler1);
      history.onExchangeAdded(handler2);

      history.add(createMockExchange("1"));

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("should remove all exchanges", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("1"));
      history.add(createMockExchange("2"));

      history.clear();

      expect(history.size()).toBe(0);
      expect(history.getAll()).toHaveLength(0);
    });
  });

  describe("getByIndex", () => {
    it("should return exchange at specified index", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("a"));
      history.add(createMockExchange("b"));
      history.add(createMockExchange("c"));

      expect(history.getByIndex(0)?.id).toBe("a");
      expect(history.getByIndex(1)?.id).toBe("b");
      expect(history.getByIndex(2)?.id).toBe("c");
    });

    it("should return undefined for out-of-bounds index", () => {
      const history = new ExchangeHistory();

      history.add(createMockExchange("1"));

      expect(history.getByIndex(-1)).toBeUndefined();
      expect(history.getByIndex(1)).toBeUndefined();
      expect(history.getByIndex(100)).toBeUndefined();
    });

    it("should return undefined for empty history", () => {
      const history = new ExchangeHistory();

      expect(history.getByIndex(0)).toBeUndefined();
    });
  });
});
