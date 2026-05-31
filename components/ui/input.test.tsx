import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input Component", () => {
  describe("Rendering", () => {
    it("renders an input element", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with default type text", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("renders with custom type", () => {
      render(<Input type="password" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "password");
    });
  });

  describe("Value handling", () => {
    it("renders with initial value", () => {
      render(<Input defaultValue="Initial" />);
      expect(screen.getByRole("textbox")).toHaveValue("Initial");
    });

    it("allows typing into the input", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");
      
      await user.type(input, "test text");
      expect(input).toHaveValue("test text");
    });

    it("handles controlled input", () => {
      const { rerender } = render(<Input value="test" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("test");
      
      rerender(<Input value="changed" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("changed");
    });
  });

  describe("Event handlers", () => {
    it("calls onChange when value changes", async () => {
      const onChange = jest.fn();
      render(<Input onChange={onChange} />);
      const input = screen.getByRole("textbox");
      
      await userEvent.type(input, "a");
      expect(onChange).toHaveBeenCalled();
    });

    it("calls onFocus when input is focused", () => {
      const onFocus = jest.fn();
      render(<Input onFocus={onFocus} />);
      
      screen.getByRole("textbox").focus();
      expect(onFocus).toHaveBeenCalled();
    });

    it("calls onBlur when input loses focus", async () => {
      const onBlur = jest.fn();
      const user = userEvent.setup();
      render(<Input onBlur={onBlur} />);
      
      const input = screen.getByRole("textbox");
      input.focus();
      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe("Attributes", () => {
    it("respects maxLength attribute", () => {
      render(<Input maxLength={5} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "5");
    });

    it("respects disabled attribute", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("respects required attribute", () => {
      render(<Input required />);
      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("respects inputMode attribute", () => {
      render(<Input inputMode="numeric" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("inputMode", "numeric");
    });

    it("respects autoComplete attribute", () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("autoComplete", "email");
    });
  });

  describe("Styling", () => {
    it("renders with default styling classes", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("px-3");
      expect(input).toHaveClass("py-2");
      expect(input).toHaveClass("border");
    });

    it("accepts custom className", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
    });

    it("has focus styling", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus:outline-none");
      expect(input).toHaveClass("focus:ring-2");
    });

    it("has border styling", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-gray-300");
    });

    it("has disabled styling", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("disabled:opacity-50");
      expect(input).toHaveClass("disabled:cursor-not-allowed");
    });
  });

  describe("Types", () => {
    it("works with email type", () => {
      render(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("works with number type", () => {
      render(<Input type="number" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "number");
    });

    it("works with tel type", () => {
      render(<Input type="tel" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "tel");
    });

    it("works with search type", () => {
      render(<Input type="search" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "search");
    });
  });

  describe("Ref forwarding", () => {
    it("forwards ref to input element", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("allows accessing input properties via ref", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" />);
      expect(ref.current?.value).toBe("test");
    });

    it("allows calling input methods via ref", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe("Placeholder behavior", () => {
    it("shows placeholder when empty", () => {
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText("Type here");
      expect(input).toHaveAttribute("placeholder", "Type here");
    });

    it("placeholder disappears when typing", async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByRole("textbox");
      
      await user.type(input, "text");
      expect(input).toHaveValue("text");
    });
  });

  describe("Edge cases", () => {
    it("handles empty input", () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("handles special characters", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");
      
      await user.type(input, "!@#$%^&*()");
      expect(input).toHaveValue("!@#$%^&*()");
    });

    it("handles unicode characters", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");
      
      await user.type(input, "café");
      expect(input).toHaveValue("café");
    });

    it("handles long input", async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole("textbox");
      
      const longText = "a".repeat(1000);
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });
  });

  describe("Accessibility", () => {
    it("can be accessed by keyboard", async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole("textbox");
      await user.tab();
      expect(input).toBeFocused();
    });

    it("has accessible role", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("works with aria-label", () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText("Search")).toBeInTheDocument();
    });
  });
});
