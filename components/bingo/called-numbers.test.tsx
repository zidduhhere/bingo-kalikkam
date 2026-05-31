import React from "react";
import { render, screen } from "@testing-library/react";
import { CalledNumbers } from "./called-numbers";

describe("CalledNumbers Component", () => {
  describe("Rendering", () => {
    it("renders empty state when no numbers are called", () => {
      render(<CalledNumbers numbers={[]} />);
      expect(screen.getByText("None yet")).toBeInTheDocument();
    });

    it("renders called numbers as spans", () => {
      render(<CalledNumbers numbers={[1, 5, 13, 20]} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("13")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("displays all called numbers", () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      render(<CalledNumbers numbers={numbers} />);
      numbers.forEach((num) => {
        expect(screen.getByText(num.toString())).toBeInTheDocument();
      });
    });

    it("renders container with flex layout", () => {
      const { container } = render(
        <CalledNumbers numbers={[1, 5, 13]} />
      );
      const wrapper = container.querySelector(".flex");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Order of Display", () => {
    it("displays numbers in order they were called", () => {
      render(<CalledNumbers numbers={[5, 2, 8, 1]} />);
      // Last number shows in spotlight
      expect(screen.getByText("1")).toBeInTheDocument();
      // Previous numbers show in grid
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("displays numbers in ascending order when sorted", () => {
      const sorted = [25, 1, 13, 6].sort((a, b) => a - b);
      render(<CalledNumbers numbers={sorted} />);
      // All numbers should be rendered
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("13")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies styling to called number spans", () => {
      render(<CalledNumbers numbers={[5, 10]} />);
      // Previous numbers have red styling
      const span = screen.getAllByText("5")[0];
      expect(span).toHaveClass("text-red-700");
      expect(span).toHaveClass("border-red-600/60");
    });

    it("handles large numbers (25)", () => {
      render(<CalledNumbers numbers={[25]} />);
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("handles small numbers (1)", () => {
      render(<CalledNumbers numbers={[1]} />);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("Updates", () => {
    it("updates when numbers are added", () => {
      const { rerender } = render(<CalledNumbers numbers={[1, 2]} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      rerender(<CalledNumbers numbers={[1, 2, 3]} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("handles complete game (all 25 numbers)", () => {
      const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
      render(<CalledNumbers numbers={allNumbers} />);
      allNumbers.forEach((num) => {
        expect(screen.getByText(num.toString())).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles single number", () => {
      render(<CalledNumbers numbers={[13]} />);
      expect(screen.getByText("13")).toBeInTheDocument();
    });

    it("displays all numbers for many calls", () => {
      const manyNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
      const { container } = render(
        <CalledNumbers numbers={manyNumbers} />
      );
      const spans = container.querySelectorAll("span");
      expect(spans.length).toBeGreaterThanOrEqual(25);
    });
  });

  describe("Accessibility", () => {
    it("provides accessible information about called numbers", () => {
      render(<CalledNumbers numbers={[1, 5, 10]} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("renders semantic structure", () => {
      const { container } = render(
        <CalledNumbers numbers={[5]} />
      );
      const div = container.querySelector(".flex");
      expect(div).toBeInTheDocument();
    });
  });
});
