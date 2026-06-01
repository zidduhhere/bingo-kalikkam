def get_all_lines(grid: list[list[int]]) -> list[list[int]]:
    SIZE = len(grid)
    lines: list[list[int]] = []

    for r in range(SIZE):
        lines.append(grid[r])
        
    return lines

if __name__ == "__main__":
    # A 5x5 square 2D matrix (25 numbers)
    bingo_grid = [
        [ 1,  2,  3,  4,  5],
        [ 6,  7,  8,  9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25]
    ]
    
    print(get_all_lines(bingo_grid))


