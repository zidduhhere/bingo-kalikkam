import React from "react";
import { render, screen } from "@testing-library/react";
import { StrikeTracker } from "./strike-tracker";

describe("StrikeTracker Component", () => {
  describe("Rendering", () => {
    it("renders for 0 strikes", () => {
      render(<StrikeTracker count={0} />);
      expect(screen.getByText("STRIKES")).toBeInTheDocument();
    });

    it("renders for 5 strikes (winning condition)", () => {
      render(<StrikeTracker count={5} />);
      expect(screen.getByText("STRIKES")).toBeInTheDocument();
    });

    it("displays strike indicators", () => {
      const { container } = render(<StrikeTracker count={3} />);
      const indicators = container.querySelectorAll("div[class*='relative']");
      expect(indicators.length).toBeGreaterThanOrEqual(5); // Default max is 5
    });
  });

  describe("Strike Count Visualization", () => {
    it("shows 0 strikes when count is 0", () => {
      const { container } = render(<StrikeTracker count={0} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(0);
    });

    it("shows 1 strike when count is 1", () => {
      const { container } = render(<StrikeTracker count={1} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
    });

    it("shows 2 strikes when count is 2", () => {
      const { container } = render(<StrikeTracker count={2} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(2);
    });

    it("shows 3 strikes when count is 3", () => {
      const { container } = render(<StrikeTracker count={3} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(3);
    });

    it("shows 4 strikes when count is 4", () => {
      const { container } = render(<StrikeTracker count={4} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(4);
    });

    it("shows 5 strikes (winner) when count is 5", () => {
      const { container } = render(<StrikeTracker count={5} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(5);
    });

    it("displays more than 5 strikes", () => {
      const { container } = render(<StrikeTracker count={8} max={10} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(8);
    });
  });

  describe("Visual Styling", () => {
    it("applies container classes", () => {
      const { container } = render(<StrikeTracker count={2} />);
      const trackerContainer = container.querySelector(".flex");
      expect(trackerContainer).toBeInTheDocument();
    });

    it("shows progress toward winning condition", () => {
      const { rerender, container } = render(<StrikeTracker count={1} />);
      expect(container.querySelectorAll("svg")).toHaveLength(1);

      rerender(<StrikeTracker count={3} />);
      expect(container.querySelectorAll("svg")).toHaveLength(3);

      rerender(<StrikeTracker count={5} />);
      expect(container.querySelectorAll("svg")).toHaveLength(5);
    });
  });

  describe("Updates", () => {
    it("updates when strike count increases", () => {
      const { rerender, container } = render(<StrikeTracker count={2} />);
      expect(container.querySelectorAll("svg")).toHaveLength(2);

      rerender(<StrikeTracker count={3} />);
      expect(container.querySelectorAll("svg")).toHaveLength(3);
    });

    it("updates when strike count reaches winning condition", () => {
      const { rerender, container } = render(<StrikeTracker count={4} />);
      expect(container.querySelectorAll("svg")).toHaveLength(4);

      rerender(<StrikeTracker count={5} />);
      expect(container.querySelectorAll("svg")).toHaveLength(5);
    });

    it("handles strike count going beyond 5 with custom max", () => {
      const { rerender, container } = render(<StrikeTracker count={5} max={10} />);
      expect(container.querySelectorAll("svg")).toHaveLength(5);

      rerender(<StrikeTracker count={6} max={10} />);
      expect(container.querySelectorAll("svg")).toHaveLength(6);
    });
  });

  describe("Edge Cases", () => {
    it("handles negative strike count gracefully", () => {
      const { container } = render(<StrikeTracker count={-1} />);
      expect(container).toBeInTheDocument();
      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });

    it("handles very high strike counts with custom max", () => {
      const { container } = render(<StrikeTracker count={100} max={100} />);
      expect(container.querySelectorAll("svg")).toHaveLength(100);
    });

    it("handles zero strikes", () => {
      const { container } = render(<StrikeTracker count={0} />);
      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });

    it("handles count exceeding max", () => {
      const { container } = render(<StrikeTracker count={6} max={5} />);
      const indicators = container.querySelectorAll("div[class*='relative']");
      expect(indicators.length).toBe(5); // Should only show max
    });

    it("renders empty when count is 0 and max is 0", () => {
      const { container } = render(<StrikeTracker count={0} max={0} />);
      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });
  });

  describe("Accessibility", () => {
    it("provides label for strike tracker", () => {
      render(<StrikeTracker count={3} />);
      expect(screen.getByText("STRIKES")).toBeInTheDocument();
    });

    it("maintains readable layout", () => {
      const { container } = render(<StrikeTracker count={5} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Different Game Scenarios", () => {
    it("shows progress in ongoing game", () => {
      const { rerender, container } = render(<StrikeTracker count={0} />);

      // Simulate game progression
      rerender(<StrikeTracker count={1} />);
      expect(container.querySelectorAll("svg")).toHaveLength(1);

      rerender(<StrikeTracker count={2} />);
      expect(container.querySelectorAll("svg")).toHaveLength(2);

      rerender(<StrikeTracker count={3} />);
      expect(container.querySelectorAll("svg")).toHaveLength(3);

      rerender(<StrikeTracker count={4} />);
      expect(container.querySelectorAll("svg")).toHaveLength(4);
    });

    it("shows winner state at 5 strikes", () => {
      const { rerender, container } = render(<StrikeTracker count={0} />);

      for (let i = 0; i <= 5; i++) {
        rerender(<StrikeTracker count={i} />);
      }

      expect(container.querySelectorAll("svg")).toHaveLength(5);
    });
  });

  describe("Custom Max Values", () => {
    it("respects custom max value", () => {
      const { container } = render(<StrikeTracker count={3} max={10} />);
      const indicators = container.querySelectorAll("div[class*='relative']");
      expect(indicators).toHaveLength(10);
    });

    it("displays correct strikes with custom max", () => {
      const { container } = render(<StrikeTracker count={7} max={10} />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(7);
    });
  });

  describe("Performance", () => {
    it("re-renders efficiently on strike count change", () => {
      const { rerender, container } = render(<StrikeTracker count={1} />);

      // Multiple rapid updates
      for (let i = 2; i <= 5; i++) {
        rerender(<StrikeTracker count={i} />);
      }

      expect(container.querySelectorAll("svg")).toHaveLength(5);
    });
  });
});
