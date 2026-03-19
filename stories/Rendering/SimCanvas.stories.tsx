import type { Meta, StoryObj } from '@storybook/react';
import { SimCanvas } from '../../src/rendering/SimCanvas';
import type { DrawCallback } from '../../src/rendering/types';
import { useCallback } from 'react';

function SimCanvasDemo({ width, height }: { width: number; height: number }) {
  const onDraw = useCallback<DrawCallback>((ctx, viewport) => {
    const w = width / viewport.scale;
    const h = height / viewport.scale;
    const step = 40;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(-viewport.tx / viewport.scale, -viewport.ty / viewport.scale, w, h);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1 / viewport.scale;

    const startX = Math.floor(-viewport.tx / viewport.scale / step) * step;
    const startY = Math.floor(-viewport.ty / viewport.scale / step) * step;

    for (let x = startX; x < startX + w + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + h + step);
      ctx.stroke();
    }
    for (let y = startY; y < startY + h + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + w + step, y);
      ctx.stroke();
    }

    // Center crosshair
    ctx.strokeStyle = 'var(--sim-accent, #6366f1)';
    ctx.lineWidth = 2 / viewport.scale;
    ctx.beginPath();
    ctx.moveTo(width / 2 / viewport.scale - 10, height / 2 / viewport.scale);
    ctx.lineTo(width / 2 / viewport.scale + 10, height / 2 / viewport.scale);
    ctx.moveTo(width / 2 / viewport.scale, height / 2 / viewport.scale - 10);
    ctx.lineTo(width / 2 / viewport.scale, height / 2 / viewport.scale + 10);
    ctx.stroke();
  }, [width, height]);

  return <SimCanvas width={width} height={height} onDraw={onDraw} />;
}

const meta: Meta<typeof SimCanvasDemo> = {
  title: 'Rendering/SimCanvas',
  component: SimCanvasDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    width: { control: { type: 'range', min: 200, max: 1200, step: 50 } },
    height: { control: { type: 'range', min: 200, max: 800, step: 50 } },
  },
};
export default meta;

type Story = StoryObj<typeof SimCanvasDemo>;

export const Default: Story = {
  args: {
    width: 600,
    height: 400,
  },
};
