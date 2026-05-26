import { render, screen } from '@testing-library/react';
import ProgressBar from '../components/common/ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct width for 50%', () => {
    const { container } = render(<ProgressBar value={50} />);
    const inner = container.querySelector('.progress-bar-inner') as HTMLElement;
    expect(inner.style.width).toBe('50%');
  });

  it('renders 0% without overflow', () => {
    const { container } = render(<ProgressBar value={0} />);
    const inner = container.querySelector('.progress-bar-inner') as HTMLElement;
    expect(inner.style.width).toBe('0%');
  });

  it('renders 100% at full width', () => {
    const { container } = render(<ProgressBar value={100} />);
    const inner = container.querySelector('.progress-bar-inner') as HTMLElement;
    expect(inner.style.width).toBe('100%');
  });
});
