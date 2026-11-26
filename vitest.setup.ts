import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

function createMediaQueryList(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn(createMediaQueryList),
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = "";
});
