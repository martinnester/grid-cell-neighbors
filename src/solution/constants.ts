import { Vec2d, type GridCellNeighborhoodsOptions, Grid } from './algorithms';

export type NGCNOptions = GridCellNeighborhoodsOptions<number>;

export class NumberGrid extends Grid<number> {
	private readonly data: number[][];
	readonly size: Vec2d;
	constructor(data: number[][]) {
		super();
		this.data = data;
		this.size = new Vec2d(this.data[0].length, this.data.length);
	}
	get(pos: Vec2d): number | undefined {
		return this.data[pos.x]?.[pos.y];
	}
	set(pos: Vec2d, value: number) {
		this.data[pos.x][pos.y] = value;
	}
	draw(ctx: CanvasRenderingContext2D, getColor: (value: number) => string, size: number): void {
		this.flatten().forEach(({ pos, value }) => {
			ctx.fillStyle = getColor(value);
			ctx.fillRect(pos.x * size, pos.y * size, size, size);
		});
	}
}

export class ImageGrid extends Grid<number> {
	draw(ctx: CanvasRenderingContext2D, getColor: (value: number) => string, size: number): void {
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.scale(size, size);
		for (const [x, line] of this.data.entries()) {
			for (const [y, image] of line.entries()) {
				if (image.bitmap) {
					ctx.drawImage(image.bitmap, x * ImageGrid.IMAGE_SIZE, y * ImageGrid.IMAGE_SIZE);
				}
			}
		}
		ctx.restore();
	}
	private readonly data: { data: ImageData; bitmap: ImageBitmap | undefined }[][];
	private static IMAGE_SIZE = 50;
	private static VALUE_OFFSET = 100;
	private xLength: number;
	private yLength: number;

	readonly size: Vec2d;
	constructor(data: number[][]) {
		super();
		this.size = new Vec2d(data[0].length, data.length);
		const xQuotient = Math.trunc(this.size.x / ImageGrid.IMAGE_SIZE);
		const xRemainder = this.size.x % ImageGrid.IMAGE_SIZE;
		this.xLength = xQuotient + 1;
		const yQuotient = Math.trunc(this.size.y / ImageGrid.IMAGE_SIZE);
		const yRemainder = this.size.y % ImageGrid.IMAGE_SIZE;
		this.yLength = yQuotient + 1;
		this.data = Array.from({ length: this.xLength }).map((_, x) =>
			Array.from({ length: this.yLength }).map((_, y) => {
				const imageData = new ImageData(
					new Uint8ClampedArray(
						data
							.slice(x * ImageGrid.IMAGE_SIZE, ImageGrid.IMAGE_SIZE)
							.flatMap((foo) =>
								foo
									.slice(y * ImageGrid.IMAGE_SIZE, ImageGrid.IMAGE_SIZE)
									.flatMap((value) => [value + ImageGrid.VALUE_OFFSET, 0, 0, 255])
							)
					),
					x === xQuotient ? xRemainder : ImageGrid.IMAGE_SIZE,
					y === yQuotient ? yRemainder : ImageGrid.IMAGE_SIZE,
					{
						colorSpace: 'srgb',
						pixelFormat: 'rgba-unorm8'
					}
				);
				const res = {
					data: imageData,
					bitmap: <ImageBitmap | undefined>undefined
				};
				createImageBitmap(imageData).then((x) => (res.bitmap = x));
				return res;
			})
		);
	}
	get(pos: Vec2d): number | undefined {
		const xQuotient = Math.trunc(pos.x / ImageGrid.IMAGE_SIZE);
		const xRemainder = pos.x % ImageGrid.IMAGE_SIZE;
		const yQuotient = Math.trunc(pos.y / ImageGrid.IMAGE_SIZE);
		const yRemainder = pos.y % ImageGrid.IMAGE_SIZE;
		const image = this.data[xQuotient][yQuotient];
		return image.data.data[(yRemainder * image.data.width + xRemainder) * 4];
	}
	set(pos: Vec2d, value: number) {
		const xQuotient = Math.trunc(pos.x / ImageGrid.IMAGE_SIZE);
		const xRemainder = pos.x % ImageGrid.IMAGE_SIZE;
		const yQuotient = Math.trunc(pos.y / ImageGrid.IMAGE_SIZE);
		const yRemainder = pos.y % ImageGrid.IMAGE_SIZE;
		const image = this.data[xQuotient][yQuotient];
		image.data.data[(yRemainder * image.data.width + xRemainder) * 4] =
			value + ImageGrid.VALUE_OFFSET;
	}
}

export const genRandomGrid = (size: number) => ({
	data: new NumberGrid(
		Array.from({ length: size }).map(() =>
			Array.from({ length: size }).map(() => (Math.random() > 0.9 ? 50 : 0))
		)
	),
	N: 1
});

export const targetPredicates = {
	'> 0': ({ value }) => value > 0
} as const satisfies Record<string, NGCNOptions['targetPredicate']>;

export const distanceFormulas = {
	Manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
	Euclidean: (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
	Chebyshev: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
} as const satisfies Record<string, NGCNOptions['distanceFormula']>;
