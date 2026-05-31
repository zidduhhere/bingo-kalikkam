import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Grid } from "./grid";

describe("Grid Component", () => {
  const defaultGrid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  describe("Rendering", () => {
    it("renders a 5x5 grid of cells", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(25);
    });

    it("renders all numbers in the grid", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      for (let i = 1; i <= 25; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it("renders with correct grid layout class", () => {
      const { container } = render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toHaveClass("grid-cols-5");
      expect(gridContainer).toHaveClass("gap-2");
    });
  });

  describe("Called numbers styling", () => {
    it("applies visual styling to called numbers", () => {
      const calledNumbers = new Set([1, 2, 3]);
      render(
        <Grid grid={defaultGrid} calledNumbers={calledNumbers} />
      );
      
      const button1 = screen.getByText("1").closest("button");
      const button6 = screen.getByText("6").closest("button");
      
      expect(button1).toHaveClass("text-red-700");
      expect(button6).not.toHaveClass("text-red-700");
    });

    it("shows crossed-out markers for called numbers", () => {
      const calledNumbers = new Set([1, 13, 25]);
      const { container } = render(
        <Grid grid={defaultGrid} calledNumbers={calledNumbers} />
      );
      
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(3);
    });

    it("handles empty called numbers set", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      const buttons = screen.getAllByRole("button");
      buttons.forEach(button => {
        expect(button).toHaveClass("text-blue-900");
      });
    });

    it("handles all numbers called", () => {
      const allCalled = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
      const { container } = render(
        <Grid grid={defaultGrid} calledNumbers={allCalled} />
      );
      
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(25);
    });
  });

  describe("Display vs Edit mode", () => {
    it("renders buttons in display mode by default", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} isEditing={false} />
      );
      expect(screen.getAllByRole("button")).toHaveLength(25);
      expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    });

    it("renders inputs in edit mode", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} isEditing={true} />
      );
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(25);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });

  describe("Cell click handling", () => {
    it("calls onCellClick with correct row and column", () => {
      const onCellClick = jest.fn();
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          onCellClick={onCellClick}
        />
      );
      
      fireEvent.click(screen.getByText("13")); // Center cell at [2, 2]
      expect(onCellClick).toHaveBeenCalledWith(2, 2);
    });

    it("calls onCellClick for each cell clicked", () => {
      const onCellClick = jest.fn();
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          onCellClick={onCellClick}
        />
      );
      
      fireEvent.click(screen.getByText("1")); // [0, 0]
      fireEvent.click(screen.getByText("25")); // [4, 4]
      
      expect(onCellClick).toHaveBeenCalledTimes(2);
      expect(onCellClick).toHaveBeenNthCalledWith(1, 0, 0);
      expect(onCellClick).toHaveBeenNthCalledWith(2, 4, 4);
    });

    it("handles undefined onCellClick gracefully", () => {
      render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      expect(() => {
        fireEvent.click(screen.getByText("13"));
      }).not.toThrow();
    });
  });

  describe("Cell change handling in edit mode", () => {
    it("calls onCellChange with row, column, and new value", () => {
      const onCellChange = jest.fn();
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          isEditing={true}
          onCellChange={onCellChange}
        />
      );
      
      const inputs = screen.getAllByRole("textbox");
      fireEvent.change(inputs[0], { target: { value: "15" } });
      
      expect(onCellChange).toHaveBeenCalledWith(0, 0, "15");
    });
  });

  describe("Ref forwarding", () => {
    it("forwards cell refs for input elements", () => {
      const cellRefs = React.createRef<(HTMLInputElement | null)[][]>();
      cellRefs.current = Array.from({ length: 5 }, () =>
        Array(5).fill(null)
      );
      
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          isEditing={true}
          cellRefs={cellRefs}
        />
      );
      
      expect(cellRefs.current[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it("forwards button refs for button elements", () => {
      const buttonRefs = React.createRef<(HTMLButtonElement | null)[][]>();
      buttonRefs.current = Array.from({ length: 5 }, () =>
        Array(5).fill(null)
      );
      
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          isEditing={false}
          buttonRefs={buttonRefs}
        />
      );
      
      expect(buttonRefs.current[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Edge cases", () => {
    it("handles grid with all zeros (empty grid)", () => {
      const emptyGrid = Array(5).fill(null).map(() => Array(5).fill(0));
      render(
        <Grid grid={emptyGrid} calledNumbers={new Set()} isEditing={true} />
      );
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(25);
    });

    it("handles different grid values", () => {
      const customGrid = [
        [25, 24, 23, 22, 21],
        [20, 19, 18, 17, 16],
        [15, 14, 13, 12, 11],
        [10, 9, 8, 7, 6],
        [5, 4, 3, 2, 1],
      ];
      render(
        <Grid grid={customGrid} calledNumbers={new Set([25, 1])} />
      );
      
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("maintains grid structure with missing onCellClick", () => {
      const { container } = render(
        <Grid grid={defaultGrid} calledNumbers={new Set()} />
      );
      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(25);
    });
  });

  describe("Keyboard interactions", () => {
    it("passes onKeyDown to cell components in edit mode", () => {
      const onCellKeyDown = jest.fn();
      render(
        <Grid
          grid={defaultGrid}
          calledNumbers={new Set()}
          isEditing={true}
          onCellKeyDown={onCellKeyDown}
        />
      );
      
      const firstInput = screen.getAllByRole("textbox")[0];
      fireEvent.keyDown(firstInput, { key: "Tab" });
      
      expect(onCellKeyDown).toHaveBeenCalled();
    });
  });
});
