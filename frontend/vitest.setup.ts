import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as React from "react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img">) => {
    // Test-safe stand-in for Next/Image without JSX.
    return React.createElement("img", props);
  },
}));
