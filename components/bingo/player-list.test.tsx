import React from "react";
import { render, screen } from "@testing-library/react";
import { PlayerList } from "./player-list";
import type { Player } from "@/lib/ws-types";

describe("PlayerList Component", () => {
  const mockPlayers: Player[] = [
    {
      id: "player1",
      name: "Alice",
      isComputer: false,
      isReady: true,
      strikeCount: 2,
    },
    {
      id: "player2",
      name: "Bob",
      isComputer: false,
      isReady: false,
      strikeCount: 1,
    },
    {
      id: "computer",
      name: "Computer",
      isComputer: true,
      isReady: true,
      strikeCount: 0,
    },
  ];

  describe("Rendering", () => {
    it("renders all players", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Computer")).toBeInTheDocument();
    });

    it("displays scoreboard title", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      expect(screen.getByText("Scoreboard")).toBeInTheDocument();
    });

    it("displays CPU badge for computer player", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      expect(screen.getByText("CPU")).toBeInTheDocument();
    });

    it("displays YOU badge for current user", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      expect(screen.getByText("YOU")).toBeInTheDocument();
    });

    it("renders with list structure", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(mockPlayers.length);
    });

    it("renders empty list when no players", () => {
      const { container } = render(
        <PlayerList players={[]} currentUserId="player1" />
      );
      const listItems = container.querySelectorAll("li");
      expect(listItems).toHaveLength(0);
    });
  });

  describe("Player Status Indicators", () => {
    it("shows CPU badge for computer players only", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      const cpuBadges = screen.getAllByText("CPU");
      expect(cpuBadges).toHaveLength(1);
    });

    it("shows YOU badge for current player only", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      const youBadges = screen.getAllByText("YOU");
      expect(youBadges).toHaveLength(1);
    });

    it("highlights current user with different styling", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const listItems = container.querySelectorAll("li");
      // First item (player1) should have red background
      expect(listItems[0]).toHaveClass("bg-red-50/50");
      // Other items should not have red background
      expect(listItems[1]).not.toHaveClass("bg-red-50/50");
    });
  });

  describe("Strike Count Display", () => {
    it("displays strike tracker for each player", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      expect(screen.getAllByText("STRIKES")).toHaveLength(3);
    });

    it("updates when strike count changes", () => {
      const { rerender } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );

      const updatedPlayers = [
        ...mockPlayers.slice(1),
        { ...mockPlayers[0], strikeCount: 5 },
      ];

      rerender(
        <PlayerList players={updatedPlayers} currentUserId="player1" />
      );

      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("handles high strike counts", () => {
      const playersWithHighStrikes: Player[] = [
        { ...mockPlayers[0], strikeCount: 12 },
      ];
      render(
        <PlayerList players={playersWithHighStrikes} currentUserId="player1" />
      );
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("Computer Player", () => {
    it("identifies and displays computer player", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      expect(screen.getByText("Computer")).toBeInTheDocument();
      expect(screen.getByText("CPU")).toBeInTheDocument();
    });

    it("distinguishes computer from human players", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      const computerElement = screen.getByText("Computer");
      expect(computerElement).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles single player", () => {
      render(
        <PlayerList players={[mockPlayers[0]]} currentUserId="player1" />
      );
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("YOU")).toBeInTheDocument();
    });

    it("handles many players", () => {
      const manyPlayers = Array.from({ length: 10 }, (_, i) => ({
        id: `player${i}`,
        name: `Player ${i}`,
        isComputer: false,
        isReady: Math.random() > 0.5,
        strikeCount: Math.floor(Math.random() * 10),
      }));

      render(
        <PlayerList players={manyPlayers} currentUserId="player0" />
      );

      expect(screen.getByText("Player 0")).toBeInTheDocument();
      expect(screen.getByText("Player 9")).toBeInTheDocument();
      expect(screen.getByText("YOU")).toBeInTheDocument();
    });

    it("handles player names with special characters", () => {
      const specialPlayers: Player[] = [
        {
          id: "player1",
          name: "Alice & Bob",
          isComputer: false,
          isReady: true,
          strikeCount: 0,
        },
        {
          id: "player2",
          name: "Player <3",
          isComputer: false,
          isReady: false,
          strikeCount: 0,
        },
      ];

      render(
        <PlayerList players={specialPlayers} currentUserId="player1" />
      );

      expect(screen.getByText("Alice & Bob")).toBeInTheDocument();
      expect(screen.getByText("Player <3")).toBeInTheDocument();
    });

    it("maintains order of players", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const names = mockPlayers.map((p) => p.name);
      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(3);
      names.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible player information", () => {
      render(<PlayerList players={mockPlayers} currentUserId="player1" />);
      mockPlayers.forEach((player) => {
        expect(screen.getByText(player.name)).toBeInTheDocument();
      });
    });

    it("provides semantic list structure", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const list = container.querySelector("ul");
      expect(list).toBeInTheDocument();
    });
  });

  describe("Current User Styling", () => {
    it("applies correct styling for current user", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const listItems = container.querySelectorAll("li");
      // Find the item for player1 (should be first)
      expect(listItems[0]).toHaveClass("border-red-400/50");
    });

    it("applies different styling for other players", () => {
      const { container } = render(
        <PlayerList players={mockPlayers} currentUserId="player1" />
      );
      const listItems = container.querySelectorAll("li");
      // Find items for other players
      expect(listItems[1]).toHaveClass("border-blue-900/10");
      expect(listItems[2]).toHaveClass("border-blue-900/10");
    });
  });
});
