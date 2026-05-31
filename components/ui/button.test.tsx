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
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("font-bold");
    });
  });

  describe("Variants", () => {
    it("renders default (primary) variant", () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-white");
      expect(button).toHaveClass("text-blue-900");
      expect(button).toHaveClass("border-2");
    });

    it("renders ghost variant with transparent background", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("text-blue-900");
    });

    it("applies ghost variant hover styles", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-900/5");
    });

    it("renders outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-blue-900/60");
    });

    it("renders secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-blue-100");
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

    it("applies disabled opacity styles", () => {
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
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
    });

    it("accepts custom className", () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("has text styling", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("font-bold");
    });

    it("has flexbox layout", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
    });
  });

  describe("Type attribute", () => {
    it("renders as a button element", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("accepts submit type via element check", () => {
      const { container } = render(<Button type="submit">Submit</Button>);
      const button = container.querySelector('button[type="submit"]');
      expect(button).toBeInTheDocument();
    });

    it("accepts reset type via element check", () => {
      const { container } = render(<Button type="reset">Reset</Button>);
      const button = container.querySelector('button[type="reset"]');
      expect(button).toBeInTheDocument();
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
    it("is keyboard accessible and can be clicked with mouse", async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Button</Button>);
      
      const button = screen.getByRole("button");
      button.focus();
      await userEvent.click(button);
      
      expect(onClick).toHaveBeenCalled();
    });

    it("has accessible role", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Hover states", () => {
    it("has primary hover styling", () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-50");
      expect(button).toHaveClass("hover:shadow-[2px_2px_0_0_rgba(30,58,138,1)]");
    });

    it("ghost variant has different hover", () => {
      render(<Button variant="ghost">No hover</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-900/5");
    });
  });

  describe("Active state", () => {
    it("applies active transform styles", () => {
      render(<Button>Press me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("active:scale-95");
      expect(button).toHaveClass("active:translate-y-[2px]");
    });
  });

  describe("Focus state", () => {
    it("has focus ring styling", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
      expect(button).toHaveClass("focus:ring-red-400");
    });
  });

  describe("Transitions", () => {
    it("has transition styling", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all");
    });
  });
});
