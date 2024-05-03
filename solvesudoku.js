function toSudoku(data: string): (number | null)[][] {
    const cells: (number | null)[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));

    const lines = data.trim().split('\n');
    for (let row = 0; row < 9; row++) {
        const line = lines[row].trim();
        for (let col = 0; col < 9; col++) {
            const char = line[col];
            if (char !== '.') {
                cells[row][col] = Number.parseInt(char);
            }
        }
    }
    return cells;
}

const INSTANCE = toSudoku(`
....61..2
.7.....6.
92.......
..452.9..
.821.463.
..3.761..
.......98
.3.....4.
6..38....
`);


const cells = [];
// 9x9 matrix of integer variables
for (let i = 0; i < 9; i++) {
    const row = [];
    for (let j = 0; j < 9; j++) {
        row.push(Z3.Int.const(`x_${i}_${j}`));
    }
    cells.push(row);
}

const solver = new Z3.Solver();

// each cell contains a value 1<=x<=9
for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        solver.add(cells[i][j].ge(1), cells[i][j].le(9));
    }
}

// each row contains a digit only once
for (let i = 0; i < 9; i++) {
    solver.add(Z3.Distinct(...cells[i]));
}

// each column contains a digit only once
for (let j = 0; j < 9; j++) {
    const column = [];
    for (let i = 0; i < 9; i++) {
        column.push(cells[i][j]);
    }
    solver.add(Z3.Distinct(...column));
}

// each 3x3 contains a digit at most once
for (let iSquare = 0; iSquare < 3; iSquare++) {
    for (let jSquare = 0; jSquare < 3; jSquare++) {
        const square = [];

        for (let i = iSquare * 3; i < iSquare * 3 + 3; i++) {
            for (let j = jSquare * 3; j < jSquare * 3 + 3; j++) {
                square.push(cells[i][j]);
            }
        }

        solver.add(Z3.Distinct(...square));
    }
}

for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const digit = INSTANCE[i][j];
        if (digit !== null) {
            solver.add(cells[i][j].eq(digit));
        }
    }
}

const is_sat = await solver.check(); // sat
const model = solver.model() as Model;
var buffer = "";

for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
        const v = model.eval(cells[i][j]);
        buffer += `${v}`;
    }
    buffer += "\n";
}
buffer