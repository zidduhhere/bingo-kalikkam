import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("renders a button element", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders button text", () => {
      render(<Button>My Button</Button>);
      expect(screen.getByText("My Button")).toBeInTheDocument();
    });

    it("renders with default styles", () => {
      render(<Button>Click</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-blue-900");
    });
  });

  describe("Variants", () => {
    it("renders default variant with primary styling", () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-blue-900");
    });

    it("renders ghost variant with transparent background", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
    });

    it("applies ghost variant hover styles", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-900/5");
    });
  });

  describe("Click handling", () => {
    it("calls onClick handler on click", async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Click</Button>);
      
      await userEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("doesn't call onClick when disabled", async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick} disabled>Click</Button>);
      
      await userEvent.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Disabled state", () => {
    it("sets disabled attribute when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("is not disabled by default", () => {
      render(<Button>Enabled</Button>);
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Size and styling", () => {
    it("renders with default padding", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-4", "py-2");
    });

    it("accepts custom className", () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("has text styling", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-white");
      expect(button).toHaveClass("font-semibold");
    });
  });

  describe("Type attribute", () => {
    it("defaults to button type", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("accepts submit type", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("accepts reset type", () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "reset");
    });
  });

  describe("Children", () => {
    it("renders multiple children", () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("renders children with React elements", () => {
      render(
        <Button>
          <em>Styled</em> Text
        </Button>
      );
      expect(screen.getByText("Styled")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Button</Button>);
      
      const button = screen.getByRole("button");
      button.focus();
      fireEvent.keyDown(button, { key: "Enter" });
      
      expect(onClick).toHaveBeenCalled();
    });

    it("has accessible role", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Hover states", () => {
    it("shows hover state for enabled buttons", () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-950");
    });

    it("doesn't show hover state for disabled buttons", () => {
      render(<Button disabled>No hover</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:cursor-not-allowed");
    });
  });

  describe("Active state", () => {
    it("applies active styles", () => {
      render(<Button>Press me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("active:bg-blue-800");
    });
  });

  describe("Focus state", () => {
    it("has focus ring styling", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
    });
  });
});
