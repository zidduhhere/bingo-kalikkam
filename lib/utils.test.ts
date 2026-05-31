import { cn, range, shuffle } from "./utils";

describe("Utils - Utility Functions", () => {
  describe("cn - Class name merger", () => {
    it("should merge single class", () => {
      expect(cn("px-2")).toBe("px-2");
    });

    it("should merge multiple classes", () => {
      const result = cn("px-2", "py-1", "text-red-500");
      expect(result).toContain("px-2");
      expect(result).toContain("py-1");
      expect(result).toContain("text-red-500");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("px-2", isActive && "bg-blue-500");
      expect(result).toContain("px-2");
      expect(result).toContain("bg-blue-500");
    });

    it("should handle false conditional classes", () => {
      const isActive = false;
      const result = cn("px-2", isActive && "bg-blue-500");
      expect(result).toBe("px-2");
      expect(result).not.toContain("bg-blue-500");
    });

    it("should merge Tailwind classes intelligently (conflicting classes)", () => {
      // tailwind-merge should handle conflicting utilities
      const result = cn("px-2", "px-4");
      expect(result).toContain("px-4"); // Last one should win
    });

    it("should handle empty strings and undefined", () => {
      const result = cn("px-2", "", undefined, "py-1");
      expect(result).toContain("px-2");
      expect(result).toContain("py-1");
    });

    it("should handle arrays of classes", () => {
      const result = cn(["px-2", "py-1"], "text-sm");
      expect(result).toContain("px-2");
      expect(result).toContain("py-1");
      expect(result).toContain("text-sm");
    });

    it("should handle complex nested conditions", () => {
      const size = "lg";
      const disabled = false;
      const result = cn(
        "btn",
        size === "lg" && "text-lg",
        size === "sm" && "text-sm",
        disabled && "opacity-50"
      );
      expect(result).toContain("btn");
      expect(result).toContain("text-lg");
      expect(result).not.toContain("text-sm");
      expect(result).not.toContain("opacity-50");
    });
  });

  describe("range - Number array generator", () => {
    it("should generate array from 1 to n", () => {
      expect(range(5)).toEqual([1, 2, 3, 4, 5]);
    });

    it("should generate single element for n=1", () => {
      expect(range(1)).toEqual([1]);
    });

    it("should generate empty array for n=0", () => {
      expect(range(0)).toEqual([]);
    });

    it("should handle larger ranges", () => {
      const result = range(100);
      expect(result).toHaveLength(100);
      expect(result[0]).toBe(1);
      expect(result[99]).toBe(100);
    });

    it("should be sequential", () => {
      const result = range(10);
      for (let i = 1; i <= 10; i++) {
        expect(result[i - 1]).toBe(i);
      }
    });

    it("should not include 0", () => {
      const result = range(5);
      expect(result).not.toContain(0);
    });

    it("should not be affected by subsequent calls", () => {
      const range1 = range(3);
      const range2 = range(5);
      expect(range1).toEqual([1, 2, 3]);
      expect(range2).toEqual([1, 2, 3, 4, 5]);
    });

    it("should work with bingo grid (25 elements)", () => {
      const result = range(25);
      expect(result).toHaveLength(25);
      expect(result[0]).toBe(1);
      expect(result[24]).toBe(25);
    });
  });

  describe("shuffle - Array shuffler", () => {
    it("should return an array of same length", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it("should not mutate original array", () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffle(original);
      expect(original).toEqual(copy);
    });

    it("should contain all original elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.sort((a, b) => a - b)).toEqual(arr);
    });

    it("should work with single element", () => {
      const arr = [1];
      const shuffled = shuffle(arr);
      expect(shuffled).toEqual([1]);
    });

    it("should work with two elements", () => {
      const arr = [1, 2];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(2);
      expect(shuffled).toContain(1);
      expect(shuffled).toContain(2);
    });

    it("should work with strings", () => {
      const arr = ["a", "b", "c", "d", "e"];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toContain("a");
      expect(shuffled).toContain("e");
    });

    it("should shuffle differently across calls (statistical test)", () => {
      const arr = Array.from({ length: 10 }, (_, i) => i);
      const shuffles = new Set<string>();

      // Shuffle multiple times
      for (let i = 0; i < 20; i++) {
        const shuffled = shuffle(arr);
        shuffles.add(JSON.stringify(shuffled));
      }

      // Should get multiple different orderings (at least 2)
      expect(shuffles.size).toBeGreaterThan(1);
    });

    it("should work with objects", () => {
      const arr = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 3, name: "c" },
      ];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(3);
      expect(shuffled.some((item) => item.id === 1)).toBe(true);
    });

    it("should work with bingo numbers", () => {
      const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
      const shuffled = shuffle(numbers);
      expect(shuffled).toHaveLength(25);
      // All numbers should be present
      for (let i = 1; i <= 25; i++) {
        expect(shuffled).toContain(i);
      }
    });

    it("should handle empty array", () => {
      const arr: number[] = [];
      const shuffled = shuffle(arr);
      expect(shuffled).toEqual([]);
    });

    it("should produce fairly random distribution", () => {
      const arr = [1, 2, 3];
      const positions: Record<string, number> = {
        "0": 0,
        "1": 0,
        "2": 0,
      };

      // Shuffle 300 times and track where 1 appears
      for (let i = 0; i < 300; i++) {
        const shuffled = shuffle(arr);
        positions[shuffled.indexOf(1).toString()]++;
      }

      // Each position should be roughly equally likely (around 100)
      expect(positions["0"]).toBeGreaterThan(50);
      expect(positions["1"]).toBeGreaterThan(50);
      expect(positions["2"]).toBeGreaterThan(50);
    });

    it("should maintain type safety", () => {
      const stringArr = ["a", "b", "c"];
      const numArr = [1, 2, 3];
      const objArr = [{ x: 1 }, { x: 2 }];

      expect(shuffle(stringArr)).toEqual(expect.any(Array));
      expect(shuffle(numArr)).toEqual(expect.any(Array));
      expect(shuffle(objArr)).toEqual(expect.any(Array));
    });
  });

  describe("Combined utility usage", () => {
    it("should work together for creating shuffled bingo grid", () => {
      const numbers = range(25);
      const shuffled = shuffle(numbers);
      const grid = Array.from({ length: 5 }, (_, i) => shuffled.slice(i * 5, i * 5 + 5));

      expect(grid).toHaveLength(5);
      grid.forEach((row) => {
        expect(row).toHaveLength(5);
        row.forEach((num) => {
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(25);
        });
      });
    });

    it("should use cn for button styling with conditions", () => {
      const disabled = false;
      const size = "lg";
      const style = cn(
        "btn",
        "py-2",
        size === "lg" && "px-4",
        size === "sm" && "px-2",
        disabled && "opacity-50"
      );

      expect(style).toContain("btn");
      expect(style).toContain("py-2");
      expect(style).toContain("px-4");
    });
  });
});
