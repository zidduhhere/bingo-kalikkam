import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cell } from "./cell";

describe("Cell Component", () => {
  describe("Display mode (not editing)", () => {
    it("renders a button with the cell value", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={false} />
      );
      expect(screen.getByRole("button")).toHaveTextContent("5");
    });

    it("renders a placeholder when value is 0", () => {
      render(
        <Cell value={0} isCalled={false} isEditing={false} />
      );
      expect(screen.getByRole("button")).toHaveTextContent("?");
    });

    it("applies isCalled visual styles when number is called", () => {
      render(
        <Cell value={5} isCalled={true} isEditing={false} />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-red-700");
      expect(button).toHaveClass("bg-red-50/50");
    });

    it("applies default styles when number is not called", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={false} />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-blue-900");
    });

    it("calls onClick handler when clicked", () => {
      const onClick = jest.fn();
      render(
        <Cell value={5} isCalled={false} isEditing={false} onClick={onClick} />
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("shows crossed-out SVG when called", () => {
      render(
        <Cell value={5} isCalled={true} isEditing={false} />
      );
      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("does not show crossed-out SVG when not called", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={false} />
      );
      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe("Editing mode", () => {
    it("renders an input instead of a button", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={true} />
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders the cell value in the input", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={true} />
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("5");
    });

    it("renders placeholder when value is 0 in edit mode", () => {
      render(
        <Cell value={0} isCalled={false} isEditing={true} />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "?");
    });

    it("limits input to 2 characters", () => {
      render(
        <Cell value={0} isCalled={false} isEditing={true} />
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input).toHaveAttribute("maxLength", "2");
    });

    it("uses numeric input mode", () => {
      render(
        <Cell value={0} isCalled={false} isEditing={true} />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("inputMode", "numeric");
    });

    it("calls onChange handler when input changes", async () => {
      const onChange = jest.fn();
      render(
        <Cell
          value={0}
          isCalled={false}
          isEditing={true}
          onChange={onChange}
        />
      );
      const input = screen.getByRole("textbox");
      await userEvent.type(input, "1");
      expect(onChange).toHaveBeenCalled();
    });

    it("calls onKeyDown handler on key press", () => {
      const onKeyDown = jest.fn();
      render(
        <Cell
          value={5}
          isCalled={false}
          isEditing={true}
          onKeyDown={onKeyDown}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Tab" });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it("allows focus on the input", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={true} onChange={() => {}} />
      );
      const input = screen.getByRole("textbox");
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe("Ref forwarding", () => {
    it("forwards inputRef to the input element when editing", () => {
      const inputRef = React.createRef<HTMLInputElement>();
      render(
        <Cell
          value={5}
          isCalled={false}
          isEditing={true}
          inputRef={inputRef}
          onChange={() => {}}
        />
      );
      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(inputRef.current?.value).toBe("5");
    });

    it("forwards buttonRef to the button element when not editing", () => {
      const buttonRef = React.createRef<HTMLButtonElement>();
      render(
        <Cell
          value={5}
          isCalled={false}
          isEditing={false}
          buttonRef={buttonRef}
        />
      );
      expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Keyboard interactions in edit mode", () => {
    it("calls onKeyDown on Tab key", () => {
      const onKeyDown = jest.fn();
      render(
        <Cell
          value={5}
          isCalled={false}
          isEditing={true}
          onKeyDown={onKeyDown}
          onChange={() => {}}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Tab" });
      expect(onKeyDown).toHaveBeenCalled();
    });

    it("calls onKeyDown on Enter key", () => {
      const onKeyDown = jest.fn();
      render(
        <Cell
          value={5}
          isCalled={false}
          isEditing={true}
          onKeyDown={onKeyDown}
          onChange={() => {}}
        />
      );
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("handles value 1", () => {
      render(
        <Cell value={1} isCalled={false} isEditing={false} />
      );
      expect(screen.getByRole("button")).toHaveTextContent("1");
    });

    it("handles value 25", () => {
      render(
        <Cell value={25} isCalled={false} isEditing={false} />
      );
      expect(screen.getByRole("button")).toHaveTextContent("25");
    });

    it("handles undefined onClick gracefully", () => {
      render(
        <Cell value={5} isCalled={false} isEditing={false} />
      );
      expect(() => {
        fireEvent.click(screen.getByRole("button"));
      }).not.toThrow();
    });
  });
});
