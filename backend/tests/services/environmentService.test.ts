import { describe, it, expect } from "vitest";
import { mergeCookies, mergeLocalStorage, mergeVariables, interpolateString, interpolateObject } from "../../src/services/environmentService.js";

describe("Environment Service - Merging Logic", () => {
  describe("mergeCookies", () => {
    it("should deep merge cookies and overwrite with child values when domain keys match", () => {
      const parentCookies = {
        "example.com/": {
          token: "parent-token",
          theme: "light"
        },
        "example.com/app": {
          session: "parent-session"
        }
      };

      const childCookies = {
        "example.com/": {
          token: "child-token"
        },
        "example.com/app-child": {
          session: "child-session"
        }
      };

      const result = mergeCookies(parentCookies, childCookies);

      expect(result).toEqual({
        "example.com/": {
          token: "child-token",
          theme: "light"
        },
        "example.com/app": {
          session: "parent-session"
        },
        "example.com/app-child": {
          session: "child-session"
        }
      });
    });

    it("should handle empty or null values gracefully", () => {
      expect(mergeCookies(null, undefined)).toEqual({});
      expect(mergeCookies({ "example.com/": { test: "1" } }, null)).toEqual({ "example.com/": { test: "1" } });
    });
  });

  describe("mergeLocalStorage", () => {
    it("should shallow merge local storage objects and child keys should override parent keys", () => {
      const parentLS = {
        theme: "dark",
        sidebar: "open",
        user: { name: "John" }
      };

      const childLS = {
        sidebar: "closed", // Overwrites
        token: "jwt-xyz" // New key
      };

      const result = mergeLocalStorage(parentLS, childLS);

      expect(result).toEqual({
        theme: "dark",
        sidebar: "closed",
        user: { name: "John" },
        token: "jwt-xyz"
      });
    });

    it("should handle empty or null values gracefully", () => {
      expect(mergeLocalStorage(null, undefined)).toEqual({});
      expect(mergeLocalStorage({ theme: "dark" }, null)).toEqual({ theme: "dark" });
    });
  });

  describe("mergeVariables", () => {
    it("should merge multiple variable records with objects and strings, overwrite from left to right, and return VariableItem objects", () => {
      const pVars = { a: "1", b: { value: "2", description: "desc-b" } };
      const gVars = { b: "3", c: { value: "4", description: "desc-c" } };
      const tcVars = { c: "5", d: { value: "6" } };
      const result = mergeVariables(pVars, gVars, tcVars);
      expect(result).toEqual({
        a: { value: "1" },
        b: { value: "3" },
        c: { value: "5" },
        d: { value: "6" }
      });
    });
  });

  describe("interpolateString", () => {
    it("should replace placeholders with variable values", () => {
      const vars = { username: "admin", host: "localhost" };
      expect(interpolateString("Hello {{username}} on {{host}}", vars)).toBe("Hello admin on localhost");
      expect(interpolateString("Keep {{missing}} intact", vars)).toBe("Keep {{missing}} intact");
    });

    it("should evaluate JS math expression", () => {
      expect(interpolateString("result = {{1 + 1}}", {})).toBe("result = 2");
    });

    it("should access native JS globals", () => {
      const timestampStr = interpolateString("{{Date.now()}}", {});
      expect(/^\d+$/.test(timestampStr)).toBe(true);
    });

    it("should fallback to static variables", () => {
      const vars = { username: "John" };
      expect(interpolateString("{{username}}", vars)).toBe("John");
    });

    it("should reference static variable in JS expression", () => {
      const vars = { username: "John" };
      expect(interpolateString("Hello {{'Mr. ' + username}}", vars)).toBe("Hello Mr. John");
    });

    it("should prohibit access to process object in sandbox", () => {
      expect(() => interpolateString("{{process.exit(1)}}", {})).toThrow();
    });

    it("should throw timeout error for infinite loops in expression", () => {
      expect(() => interpolateString("{{while(true){}}}", {})).toThrow();
    });

    it("should support named snapshots via $vars Proxy", () => {
      const context = { snapshots: new Map<string, string>() };
      const template = "{{$vars.tempId ??= crypto.randomUUID()}} and {{$vars.tempId}}";
      const result = interpolateString(template, {}, context);
      
      const parts = result.split(" and ");
      expect(parts[0]).toBe(parts[1]); // Ensure both evaluations return the same generated UUID
      expect(context.snapshots.get("tempId")).toBe(parts[0]);
    });
  });

  describe("interpolateObject", () => {
    it("should recursively replace placeholders in nested objects and arrays", () => {
      const vars = { token: "12345", url: "https://example.com" };
      const obj = {
        headers: {
          Authorization: "Bearer {{token}}"
        },
        urls: ["{{url}}/login", "{{url}}/dashboard"],
        nested: {
          arr: [{ url: "{{url}}" }]
        }
      };
      const result = interpolateObject(obj, vars);
      expect(result).toEqual({
        headers: {
          Authorization: "Bearer 12345"
        },
        urls: ["https://example.com/login", "https://example.com/dashboard"],
        nested: {
          arr: [{ url: "https://example.com" }]
        }
      });
    });
  });
});
