import { render, screen, fireEvent } from '@testing-library/react';
import RatingStars from '../components/common/RatingStars';

describe('RatingStars', () => {
  it('renders 5 star buttons', () => {
    render(<RatingStars value={null} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onChange with the clicked star index', () => {
    const onChange = vi.fn();
    render(<RatingStars value={null} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // 3rd star = rating 3
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('shows label when provided', () => {
    render(<RatingStars value={null} label="Ease" />);
    expect(screen.getByText('Ease')).toBeInTheDocument();
  });

  it('renders with an existing rating without crashing', () => {
    const { container } = render(<RatingStars value={4} />);
    expect(container).toBeTruthy();
  });
});
