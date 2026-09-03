<script lang="ts">
	import { Slider, Dialog, Portal, Switch } from '@skeletonlabs/skeleton-svelte';
	import { onMount, type Snippet } from 'svelte';
	import PinIcon from '@lucide/svelte/icons/pin';
	import PinOffIcon from '@lucide/svelte/icons/pin-off';
	import MenuIcon from '@lucide/svelte/icons/menu';

	import { useEventListener } from 'runed';
	import { countGridCellNeighborhoods, reduceCells } from '../solution/algorithms';
	import {
		accumulators,
		distanceFormulas,
		gridPresets,
		targetPredicates,
		type NCGCNResult
	} from '../solution/constants';

	let pinned = $state(true);
	let min = $state(-50);
	let max = $state(50);

	let current = $state(0);
	let result = $state<NCGCNResult>({
		accumulation: 0,
		effected: []
	});
	let A: keyof typeof accumulators = $state('Add One');
	let T: keyof typeof targetPredicates = $state('> 0');
	let D: keyof typeof distanceFormulas = $state('Manhattan');
	let P: keyof typeof gridPresets = $state('Example 1');

	let dimEffected = $state(true);

	let grid = $derived(gridPresets[P]);

	let canvas: HTMLCanvasElement | null = $state(null);
	let canvasParent: HTMLDivElement | null = $state(null);

	// The following animations are optional.
	// These may also be included inline.
	const animModal =
		'transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
	const animBackdrop =
		'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';

	let mouseDown = false;
	useEventListener(
		() => canvas,
		'mousedown',
		() => (mouseDown = true)
	);
	useEventListener(
		() => canvas,
		'mouseup',
		() => (mouseDown = false)
	);
	const getM = () => {
		return {
			x: (mouse.x * window.devicePixelRatio) / z,
			y: (mouse.y * window.devicePixelRatio) / z
		};
	};
	const getColor = (cell: number) => {
		const percentGreen = ((cell - min) / (max - min)) * 100;
		return `color-mix(in lch, #ff0000 ${100 - percentGreen}%, #00ff00 ${percentGreen}%)`;
	};
	const updateResult = () => {
		result = countGridCellNeighborhoods(grid.data, grid.N, {
			distanceFormula: distanceFormulas[D],
			accumulator: accumulators[A],
			targetPredicate: targetPredicates[T],
			initialAccumulation: 0
		});
	};

	const draw = () => {
		// nullish checks:
		if (!canvasParent) {
			throw new Error('Canvas parent failed to mount');
		}
		if (!canvas) {
			throw new Error('Canvas failed to mount');
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get CanvasRenderingContext2D');
		}

		// resize (TO-DO: just put in ResizeObserver?)
		canvas.width = canvasParent.clientWidth * window.devicePixelRatio;
		canvas.height = canvasParent.clientHeight * window.devicePixelRatio;
		// move bases on panning/zoom
		ctx.scale(z, z);
		ctx.translate(-x, -y);

		// helpers:
		const size = 10;
		const m = getM();

		// display input data:
		reduceCells(
			grid.data,
			(_, cell, [i, j]) => {
				ctx.fillStyle = getColor(cell);
				ctx.fillRect(j * size, i * size, size, size);
				ctx.lineWidth = 0.5;
				if (
					x + m.x >= j * size &&
					x + m.x <= j * size + size &&
					y + m.y >= i * size &&
					y + m.y <= i * size + size
				) {
					ctx.strokeRect(j * size, i * size, size, size);
					if (mouseDown) {
						if (grid.data[i][j] !== current) {
							grid.data[i][j] = current;
							updateResult();
						}
					}
				}
			},
			<void>undefined
		);

		// display results:
		result.effected.forEach(([i, j]) => {
			ctx.fillStyle = '#ffffff4f';
			ctx.fillRect(j * size, i * size, size, size);
		});

		// user cursor:
		ctx.fillStyle = getColor(current);
		ctx.lineWidth = 1;
		ctx.fillRect(x + m.x - 2.5, y + m.y - 2.5, 5, 5);
		ctx.strokeRect(x + m.x - 2.5, y + m.y - 2.5, 5, 5);

		//rinse and repeat:
		requestAnimationFrame(draw);
	};
	let x = -20;
	let y = -20;
	let z = 8;
	const mouse = { x: 0, y: 0 };
	useEventListener(
		() => canvas,
		'wheel',
		(e) => {
			const zDelta = 1.001 ** e.deltaY;
			if (e.metaKey || e.ctrlKey) {
				const m = getM();
				z *= zDelta;
				x += m.x * zDelta - m.x;
				y += m.y * zDelta - m.y;
			} else {
				x += e.deltaX * 0.5;
				y += e.deltaY * 0.5;
			}
		}
	);
	useEventListener(
		() => canvas,
		'mousemove',
		(e) => {
			if (!canvas) {
				return;
			}
			const rect = canvas.getBoundingClientRect();
			mouse.x = e.clientX - rect.left;
			mouse.y = e.clientY - rect.top;
			// console.log(mouse.x,mouse.y)
		}
	);
	$effect(() => {
		updateResult();
	});
	onMount(() => {
		new Worker(new URL('./worker.ts', import.meta.url));
		requestAnimationFrame(draw);
	});
</script>

{#snippet slider()}
	<Slider
		value={[current]}
		onValueChange={(details) => {
			current = details.value[0];
		}}
		step={5}
		{min}
		{max}
	>
		<Slider.Control>
			<Slider.Track class="h-6 bg-linear-to-r from-my-red to-my-green">
				<Slider.Range class="bg-transparent" />
			</Slider.Track>
			<Slider.Thumb index={0} class="h-8">
				<Slider.HiddenInput />
			</Slider.Thumb>
		</Slider.Control>
		<Slider.MarkerGroup>
			{#each Array.from( { length: Math.abs((max - min) / 25) + 1 } ).map((_, i) => (Math.ceil(min / 25) + i) * 25) as e, index (index)}
				<Slider.Marker value={e} />
			{/each}
		</Slider.MarkerGroup>
	</Slider>
{/snippet}
{#snippet presetSelector()}
	<select class="select" bind:value={P}>
		{#each Object.entries(gridPresets) as [k] (k)}
			<option value={k}>{k}</option>
		{/each}
	</select>
{/snippet}
{#snippet controls(action: Snippet)}
	<header class="flex items-center justify-between gap-2">
		<h3 class="syncopate-bold h3" style="color: #FFFF88;">GRID CELL NEIGHBORS</h3>
		{@render action()}
	</header>
	{@render presetSelector()}

	<div class="space-y-2">
		<h3 class="h5">Algorithm Options</h3>
		<label class="label">
			<span class="label-text"
				>Distance Formula <span class="badge preset-filled-brand">D</span></span
			>
			<select class="select" bind:value={D}>
				{#each Object.entries(distanceFormulas) as [k] (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			<span class="label-text">Blast Radius <span class="badge preset-filled-brand">N</span></span>
			<input
				class="input"
				type="number"
				placeholder="Input"
				bind:value={grid.N}
				min="0"
				onchange={updateResult}
			/>
		</label>
		<label class="label">
			<span class="label-text"
				>Target Predicate <span class="badge preset-filled-brand">T</span></span
			>
			<select class="select" bind:value={T}>
				{#each Object.entries(targetPredicates) as [k] (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			<span class="label-text">Accumulator <span class="badge preset-filled-brand">A</span></span>
			<select class="select" bind:value={A}>
				{#each Object.entries(accumulators) as [k] (k)}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</label>
	</div>
	<Switch checked={dimEffected} onCheckedChange={(details) => (dimEffected = details.checked)}>
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
		<Switch.Label>Dim Effected</Switch.Label>
		<Switch.HiddenInput />
	</Switch>
	<div class="space-y-2">
		<h3 class="h5">Grid</h3>
		<div class="flex flex-row gap-4">
			<label class="label">
				<span class="label-text">Cell Minimum</span>
				<input class="input" type="number" placeholder="Input" bind:value={min} />
			</label>
			<label class="label">
				<span class="label-text">Cell Maximum</span>
				<input class="input" type="number" placeholder="Input" bind:value={max} />
			</label>
			<label class="label">
				<span class="label-text">Cell Current</span>
				<input class="input" type="number" placeholder="Input" bind:value={current} />
			</label>
		</div>

		{@render slider()}
	</div>
	<div
		class="badge-base LI-profile-badge"
		data-locale="en_US"
		data-size="medium"
		data-theme="dark"
		data-type="VERTICAL"
		data-vanity="martinnester"
		data-version="v1"
	>
		<a
			class="badge-base__link LI-simple-link"
			style="display: none;"
			href="https://www.linkedin.com/in/martinnester?trk=profile-badge">Martin Nester</a
		>
	</div>
{/snippet}

{#snippet unpinAction()}
	<button class="btn-icon hover:preset-tonal" onclick={() => (pinned = false)}>
		<PinOffIcon />
	</button>
{/snippet}
{#if pinned}
	<div class="space-y-8 bg-surface-100-900 p-4">
		{@render controls(unpinAction)}
	</div>
{/if}

<div bind:this={canvasParent} class="my-canvas-wrapper">
	{#snippet pinAction()}
		<Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={() => (pinned = true)}>
			<PinIcon />
		</Dialog.CloseTrigger>
	{/snippet}
	{#if !pinned}
		<div class="absolute top-4 left-4 flex w-200 flex-row gap-8">
			<Dialog>
				<Dialog.Trigger class="btn-icon preset-filled"><MenuIcon /></Dialog.Trigger>

				<Portal>
					<Dialog.Backdrop
						class="fixed inset-0 z-50 bg-surface-50-950/50 transition transition-discrete {animBackdrop}"
					/>
					<Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
						<Dialog.Content
							class="h-screen w-sm space-y-8 card bg-surface-100-900 p-4 shadow-xl {animModal}"
						>
							{@render controls(pinAction)}
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog>
			{@render presetSelector()}
			{@render slider()}
		</div>
	{/if}
	<h3 class="syncopate-bold absolute top-4 right-4 flex flex-row gap-8 h3">
		{result.accumulation.toLocaleString()}
	</h3>

	<canvas bind:this={canvas} class="my-canvas"></canvas>
</div>

<style>
	.my-canvas {
		width: 100%;
		height: 100%;
	}
	.my-canvas-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
	}
</style>
